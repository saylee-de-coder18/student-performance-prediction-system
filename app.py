from flask import Flask, render_template, request, redirect, session, send_file, url_for
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from datetime import datetime
import uuid
import smtplib
import ssl
from email.message import EmailMessage
from itsdangerous import URLSafeTimedSerializer
import os

app = Flask(__name__)

MAIL_USERNAME = os.environ.get("MAIL_USERNAME")
MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD")

app.config['SECRET_KEY'] = os.environ.get(
    "SECRET_KEY",
    "student_prediction_secret")
database_url = os.environ.get("DATABASE_URL")

if database_url:
   
    if database_url.startswith("postgres://"):
        database_url = database_url.replace(
            "postgres://",
            "postgresql://",
            1
        )

    app.config["SQLALCHEMY_DATABASE_URI"] = database_url
else:
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False


serializer = URLSafeTimedSerializer(
    app.config['SECRET_KEY']
)
db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    fullname = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)

class Prediction(db.Model):

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    user_id = db.Column(
        db.Integer,
        nullable=False
    )
 
    session_id = db.Column(
    db.String(50),
    nullable=False
)
    course_code = db.Column(
        db.String(20),
        nullable=False
    )

    course_name = db.Column(
        db.String(100),
        nullable=False
    )

    predicted_score = db.Column(
        db.Float,
        nullable=False
    )

    predicted_grade = db.Column(
        db.String(5),
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

def send_reset_email(recipient, reset_link):
    msg = EmailMessage()

    msg["Subject"] = "Password Reset Request"

    msg["From"] = MAIL_USERNAME

    msg["To"] = recipient

    msg.set_content(f"""
Hello,

You requested to reset your password.

Click the link below:

{reset_link}

If you did not request this, please ignore this email.

Student Performance Prediction System
""")

    context = ssl.create_default_context()

    with smtplib.SMTP("smtp.gmail.com", 587) as server:

        server.starttls(context=context)

        server.login(MAIL_USERNAME, MAIL_PASSWORD)

        server.send_message(msg)

# HOME ROUTE
@app.route('/')
def home():
    return redirect('/signup')

# SIGNUP PAGE
@app.route('/signup', methods=['GET', 'POST'])
def signup():

    if request.method == 'POST':

        fullname = request.form['fullname']
        email = request.form['email']
        password = request.form['password']

        # Check if email already exists
        existing_user = User.query.filter_by(
            email=email
        ).first()

        if existing_user:
            return "Email already registered. Please use another email."

        # Hash password
        hashed_password = generate_password_hash(password)

        new_user = User(
            fullname=fullname,
            email=email,
            password=hashed_password
        )

        db.session.add(new_user)
        db.session.commit()

        return redirect('/login')

    return render_template('signup.html')

#LOGIN PAGE
@app.route('/login', methods=['GET', 'POST'])
def login():

    if request.method == 'POST':

        email = request.form['email']
        password = request.form['password']

        user = User.query.filter_by(
            email=email
        ).first()

        if user and check_password_hash(
                user.password,
                password):

            session['user_id'] = user.id
            session['fullname'] = user.fullname

            return redirect('/dashboard')

        return "Invalid Email or Password"

    return render_template('login.html')

#DASHBOARD ROUTE
@app.route('/dashboard')
def dashboard():

    if 'user_id' not in session:
        return redirect('/login')

    return render_template(
        'dashboard.html',
        fullname=session['fullname']
    )

#LOG OUT ROUTE
@app.route('/logout')
def logout():

    session.clear()

    return redirect('/login')

with app.app_context():
        db.create_all()

#PDF REPORT ROUTE
@app.route('/download-report')
def download_report():

    if 'user_id' not in session:
        return redirect('/login')

    pdf_file = "Student_Report.pdf"

    doc = SimpleDocTemplate(pdf_file)

    styles = getSampleStyleSheet()

    content = []

    student_name = session.get(
        'fullname',
        'Student'
    )

    predictions = Prediction.query.filter_by(
        user_id=session['user_id']
    ).all()

    content.append(
        Paragraph(
            "STUDENT PERFORMANCE PREDICTION REPORT",
            styles['Title']
        )
    )

    content.append(Spacer(1, 20))

    content.append(
        Paragraph(
            f"<b>Student Name:</b> {student_name}",
            styles['Normal']
        )
    )

    content.append(Spacer(1, 20))

    if len(predictions) == 0:

        content.append(
            Paragraph(
                "No prediction records available.",
                styles['Normal']
            )
        )

    else:

        for prediction in predictions:

            content.append(
                Paragraph(
                    f"<b>{prediction.course_code}</b> - {prediction.course_name}",
                    styles['Heading3']
                )
            )

            content.append(
                Paragraph(
                    f"Predicted Score: {prediction.predicted_score:.2f}%",
                    styles['Normal']
                )
            )

            content.append(
                Paragraph(
                    f"Predicted Grade: {prediction.predicted_grade}",
                    styles['Normal']
                )
            )

            content.append(
                Paragraph(
                    f"Date Generated: {prediction.created_at.strftime('%d %b %Y %I:%M %p')}",
                    styles['Normal']
                )
            )

            content.append(
                Paragraph(
                    "_" * 80,
                    styles['Normal']
                )
            )

            content.append(
                Spacer(1, 10)
            )

    content.append(
        Spacer(1, 20)
    )

    content.append(
        Paragraph(
            "Generated by Student Performance Prediction System",
            styles['Italic']
        )
    )

    doc.build(content)

    return send_file(
        pdf_file,
        as_attachment=True
    )

#HISTORY ROUTE
from collections import defaultdict

@app.route('/history')
def history():

    if 'user_id' not in session:
        return redirect('/login')

    predictions = Prediction.query.filter_by(
        user_id=session['user_id']
    ).order_by(
        Prediction.created_at.desc()
    ).all()

    grouped_predictions = defaultdict(list)

    for prediction in predictions:

        grouped_predictions[
            prediction.session_id
        ].append(prediction)

    return render_template(
        'history.html',
        grouped_predictions=grouped_predictions
    )

#SAVE ROUTE
@app.route('/save-predictions', methods=['POST'])
def save_predictions():

    if 'user_id' not in session:
        return {"message": "Not logged in"}, 401

    data = request.get_json()

    session_id = str(uuid.uuid4())

    for item in data:

        prediction = Prediction(

            user_id=session['user_id'],
            session_id=session_id,
            course_code=item['course_code'],
            course_name=item['course_name'],
            predicted_score=item['predicted_score'],
            predicted_grade=item['predicted_grade']
        )

        db.session.add(prediction)

    db.session.commit()

    return {"message": "Predictions saved"}

#HELP ROUTE
@app.route('/help')
def help_page():

    if 'user_id' not in session:
        return redirect('/login')

    return render_template('help.html')

#FORGOT PW ROUTE
@app.route('/forgot-password',
methods=['GET', 'POST'])
def forgot_password():

    if request.method == 'POST':

        email = request.form['email']

        user = User.query.filter_by(
            email=email
        ).first()

        if user:

            token = serializer.dumps(
                email,
                salt='password-reset'
            )

            reset_link = url_for(
                'reset_password',
                token=token,
                _external=True
            )

            send_reset_email(
                email,
                reset_link
            )
    return render_template(
        'forgot_password.html'
    )

#RESET PW ROUTE
@app.route(
'/reset-password/<token>',
methods=['GET', 'POST']
)
def reset_password(token):

    try:

        email = serializer.loads(
            token,
            salt='password-reset',
            max_age=3600
        )

    except:

        return 'Reset link expired.'

    user = User.query.filter_by(
        email=email
    ).first()

    if request.method == 'POST':

        password = request.form['password']

        user.password = generate_password_hash(
            password
        )

        db.session.commit()

        return redirect('/login')

    return render_template(
        'reset_password.html'
    )

if __name__ == '__main__':    
   
    import os

    app.config['SECRET_KEY'] = os.environ.get(
    'SECRET_KEY',
    'my_local_secret_key'
)
    app.run(debug=True)