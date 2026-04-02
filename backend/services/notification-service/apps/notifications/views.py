import logging
from django.utils   import timezone
from django.core.mail import send_mail, EmailMultiAlternatives
from django.conf    import settings
from rest_framework.views    import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import Notification

logger   = logging.getLogger(__name__)
INTERNAL = 'internal-service-secret'

def is_internal(request):
    return request.headers.get('X-Service-Token') == INTERNAL


# ── Core email sender ─────────────────────────────────────────────
def send_email(user_id, email, subject, html_body, plain_body=None):
    """Send HTML email and record in DB. Never raises — logs failures."""
    import uuid as _uuid
    try:
        safe_uuid = _uuid.UUID(str(user_id))
    except (ValueError, AttributeError):
        safe_uuid = _uuid.uuid4()
    notif = Notification.objects.create(
        user_id=user_id, notif_type='email',
        subject=subject, body=plain_body or html_body,
        recipient=email, status='pending',
    )
    if not email:
        notif.status = 'failed'; notif.save(update_fields=['status']); return notif

    try:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=plain_body or 'Please view this email in an HTML-compatible client.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[email],
        )
        msg.attach_alternative(html_body, 'text/html')
        msg.send(fail_silently=False)
        notif.status = 'sent'; notif.sent_at = timezone.now()
        notif.save(update_fields=['status', 'sent_at'])
        logger.info(f'Email sent to {email} | {subject}')
    except Exception as e:
        notif.status = 'failed'; notif.save(update_fields=['status'])
        logger.error(f'Email failed to {email}: {e}')
    return notif


# ── HTML template builder ─────────────────────────────────────────
def make_html(title, greeting, rows, footer_note='', cta_text='', cta_link='', color='#C9A84C'):
    rows_html = ''.join(
        f'<tr><td style="padding:10px 16px;color:#888;font-size:14px;border-bottom:1px solid #2a2a2a">{k}</td>'
        f'<td style="padding:10px 16px;color:#fff;font-size:14px;font-weight:600;border-bottom:1px solid #2a2a2a;text-align:right">{v}</td></tr>'
        for k, v in rows
    )
    cta = (f'<div style="text-align:center;margin:28px 0">'
           f'<a href="{cta_link}" style="background:{color};color:#1a1a1a;padding:12px 32px;border-radius:8px;'
           f'text-decoration:none;font-weight:700;font-size:15px">{cta_text}</a></div>') if cta_text else ''
    return f"""
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:40px 0">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:12px;overflow:hidden;border:1px solid #2a2a2a">
  <!-- Header -->
  <tr><td style="background:linear-gradient(135deg,#1a1a1a 0%,#2a2a2a 100%);padding:28px 32px;border-bottom:2px solid {color}">
    <h1 style="margin:0;font-size:22px;color:{color};font-family:Georgia,serif;letter-spacing:1px">🏦 AND Bank</h1>
    <p style="margin:6px 0 0;color:#888;font-size:13px">{title}</p>
  </td></tr>
  <!-- Body -->
  <tr><td style="padding:28px 32px">
    <p style="color:#ccc;font-size:15px;margin:0 0 20px">{greeting}</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#111;border-radius:8px;overflow:hidden;border:1px solid #2a2a2a">
      {rows_html}
    </table>
    {cta}
  </td></tr>
  <!-- Footer -->
  <tr><td style="padding:20px 32px;background:#111;border-top:1px solid #2a2a2a">
    <p style="margin:0;color:#555;font-size:12px;text-align:center">{footer_note}</p>
    <p style="margin:8px 0 0;color:#333;font-size:11px;text-align:center">© AND Bank · Secure Banking Platform · Do not reply to this email</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>"""


# ── 1. OTP ────────────────────────────────────────────────────────
class OTPNotificationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        if not is_internal(request): return Response({'detail':'Forbidden'},status=403)
        user_id = request.data.get('user_id','')
        email   = request.data.get('email','')
        name    = request.data.get('name','Customer')
        otp     = request.data.get('otp','')
        purpose = request.data.get('purpose','login')
        expires = request.data.get('expires_minutes', 10)

        labels  = {'login':'Login','register':'Registration','password_reset':'Password Reset'}
        label   = labels.get(purpose,'Verification')

        html = make_html(
            title   = f'{label} OTP',
            greeting= f'Dear {name}, your AND Bank {label} OTP is below.',
            rows    = [
                ('OTP Code',    f'<span style="font-size:28px;letter-spacing:8px;color:#C9A84C;font-family:monospace">{otp}</span>'),
                ('Purpose',     label),
                ('Valid For',   f'{expires} minutes'),
                ('If not you?', 'Ignore this email and your account stays safe'),
            ],
            footer_note='Never share this OTP with anyone. AND Bank will never ask for it.',
            color='#C9A84C',
        )
        n = send_email(user_id, email, f'AND Bank — Your {label} OTP: {otp}', html)
        return Response({'detail':'sent','id':str(n.id)})


# ── 2. Welcome ────────────────────────────────────────────────────
class WelcomeNotificationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        if not is_internal(request): return Response({'detail':'Forbidden'},status=403)
        user_id        = request.data.get('user_id','')
        email          = request.data.get('email','')
        name           = request.data.get('name','Customer')
        account_number = request.data.get('account_number','')
        upi_id         = request.data.get('upi_id','')

        html = make_html(
            title   = 'Welcome to AND Bank',
            greeting= f'Dear {name}, your AND Bank account is ready. Here are your details:',
            rows    = [
                ('Account Number', account_number or '—'),
                ('UPI ID',         upi_id or '—'),
                ('Account Type',   'Savings Account'),
                ('Status',         '✅ Active'),
            ],
            footer_note='Keep your account number and UPI ID safe.',
            cta_text='Login to AND Bank',
            cta_link='http://localhost:3001',
            color='#C9A84C',
        )
        n = send_email(user_id, email, 'Welcome to AND Bank — Your Account is Ready!', html)
        return Response({'detail':'sent','id':str(n.id)})


# ── 3. Transaction ────────────────────────────────────────────────
class TransactionNotificationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        if not is_internal(request): return Response({'detail':'Forbidden'},status=403)
        user_id    = request.data.get('user_id','')
        email      = request.data.get('email','')
        name       = request.data.get('name','Customer')
        amount     = request.data.get('amount','0')
        txn_type   = request.data.get('txn_type','debit')
        txn_id     = request.data.get('txn_id','')
        mode       = request.data.get('mode','IMPS').upper()
        to_from    = request.data.get('to_from','')
        balance    = request.data.get('balance_after','')
        remark     = request.data.get('remark','')

        is_debit  = txn_type == 'debit'
        color     = '#ef4444' if is_debit else '#22c55e'
        icon      = '↑ Debited' if is_debit else '↓ Credited'
        subj_icon = '🔴' if is_debit else '🟢'

        rows = [
            ('Amount',    f'<span style="color:{color};font-size:20px;font-weight:700">₹{amount}</span>'),
            ('Type',      icon),
            ('Mode',      mode),
            ('Txn ID',    f'<span style="font-family:monospace;font-size:13px">{txn_id}</span>'),
        ]
        if to_from: rows.append(('To / From', to_from))
        if balance: rows.append(('Balance After', f'₹{balance}'))
        if remark:  rows.append(('Remark', remark))

        html = make_html(
            title   = 'Transaction Alert',
            greeting= f'Dear {name}, a transaction was processed on your AND Bank account.',
            rows    = rows,
            footer_note='If you did not initiate this, call AND Bank support immediately.',
            color   = color,
        )
        n = send_email(user_id, email,
            f'{subj_icon} AND Bank — ₹{amount} {icon} via {mode} | {txn_id}', html)
        return Response({'detail':'sent','id':str(n.id)})


# ── 4. Loan Application (to admin) ───────────────────────────────
class LoanApplicationNotificationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        if not is_internal(request): return Response({'detail':'Forbidden'},status=403)
        admin_email  = request.data.get('admin_email', settings.ADMIN_EMAIL)
        applicant    = request.data.get('applicant_name','')
        loan_type    = request.data.get('loan_type','').title()
        amount       = request.data.get('amount','')
        tenure       = request.data.get('tenure_months','')
        loan_id      = request.data.get('loan_id','')

        html = make_html(
            title   = 'New Loan Application',
            greeting= f'A new loan application requires your review.',
            rows    = [
                ('Applicant',  applicant),
                ('Loan Type',  loan_type),
                ('Amount',     f'₹{amount}'),
                ('Tenure',     f'{tenure} months'),
                ('Loan ID',    f'<span style="font-family:monospace">{loan_id}</span>'),
                ('Status',     '⏳ Pending Review'),
            ],
            footer_note='Login to AND Bank Admin Panel to review this application.',
            cta_text='Review in Admin Panel',
            cta_link='http://localhost:3001/admin/loans',
            color='#f59e0b',
        )
        n = send_email('admin', admin_email,
            f'AND Bank Admin — New {loan_type} Loan Application ₹{amount} from {applicant}', html)
        return Response({'detail':'sent','id':str(n.id)})


# ── 5. Loan Decision (to user) ────────────────────────────────────
class LoanDecisionNotificationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        if not is_internal(request): return Response({'detail':'Forbidden'},status=403)
        user_id    = request.data.get('user_id','')
        email      = request.data.get('email','')
        name       = request.data.get('name','Customer')
        loan_type  = request.data.get('loan_type','').title()
        amount     = request.data.get('amount','')
        action     = request.data.get('action','')   # approved / rejected
        note       = request.data.get('admin_note','')
        emi        = request.data.get('emi_amount','')
        rate       = request.data.get('interest_rate','')

        received = action == 'received'
        approved = action == 'approved'
        color = '#C9A84C' if received else ('#22c55e' if approved else '#ef4444')
        icon = '📋 Application Received' if received else ('✅ Approved' if approved else '❌ Rejected')

        rows = [
            ('Loan Type',  loan_type),
            ('Amount',     f'₹{amount}'),
            ('Decision',   f'<span style="color:{color};font-weight:700">{icon}</span>'),
        ]
        if approved and emi:    rows.append(('Monthly EMI', f'₹{emi}'))
        if approved and rate:   rows.append(('Interest Rate', f'{rate}% p.a.'))
        if note:                rows.append(('Note from Bank', note))

        greeting = (
            f'Dear {name}, we have received your {loan_type} loan application. Our team will review it within 2-3 working days.'
            if received else
            f'Congratulations {name}! Your {loan_type} loan application has been approved.'
            if approved else
            f'Dear {name}, we regret to inform you that your {loan_type} loan application was not approved at this time.'
        )
        html = make_html(
            title   = f'Loan Application {icon}',
            greeting= greeting,
            rows    = rows,
            footer_note='For queries, contact AND Bank support.' if not approved else 'Your loan will be disbursed within 2-3 working days.',
            color   = color,
        )
        n = send_email(user_id, email,
            f'AND Bank — Your {loan_type} Loan Application has been {action.title()}', html)
        return Response({'detail':'sent','id':str(n.id)})


# ── 6. Credit Card Application (to admin) ────────────────────────
class CardApplicationNotificationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        if not is_internal(request): return Response({'detail':'Forbidden'},status=403)
        admin_email = request.data.get('admin_email', settings.ADMIN_EMAIL)
        applicant   = request.data.get('applicant_name','')
        income      = request.data.get('annual_income','')
        employment  = request.data.get('employment_type','').title()
        purpose     = request.data.get('purpose','')
        card_id     = request.data.get('card_id','')

        html = make_html(
            title   = 'New Credit Card Application',
            greeting= 'A new credit card application requires your review.',
            rows    = [
                ('Applicant',       applicant),
                ('Annual Income',   f'₹{income}'),
                ('Employment Type', employment),
                ('Purpose',         purpose or '—'),
                ('Card ID',         f'<span style="font-family:monospace">{card_id}</span>'),
                ('Status',          '⏳ Pending Review'),
            ],
            footer_note='Login to AND Bank Admin Panel to review this application.',
            cta_text='Review in Admin Panel',
            cta_link='http://localhost:3001/admin/cards',
            color='#a855f7',
        )
        n = send_email('admin', admin_email,
            f'AND Bank Admin — New Credit Card Application from {applicant}', html)
        return Response({'detail':'sent','id':str(n.id)})


# ── 7. Card Decision (to user) ────────────────────────────────────
class CardDecisionNotificationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        if not is_internal(request): return Response({'detail':'Forbidden'},status=403)
        user_id  = request.data.get('user_id','')
        email    = request.data.get('email','')
        name     = request.data.get('name','Customer')
        action   = request.data.get('action','')   # approved / rejected
        limit    = request.data.get('credit_limit','')
        note     = request.data.get('admin_note','')
        network  = request.data.get('network','Visa').title()

        approved = action == 'approved'
        color    = '#a855f7' if approved else '#ef4444'
        icon     = '✅ Approved' if approved else '❌ Rejected'

        rows = [
            ('Card Type',  'Credit Card'),
            ('Network',    network),
            ('Decision',   f'<span style="color:{color};font-weight:700">{icon}</span>'),
        ]
        if approved and limit: rows.append(('Credit Limit', f'₹{int(limit):,}'))
        if note: rows.append(('Note from Bank', note))

        greeting = (
            f'Great news {name}! Your AND Bank Credit Card has been approved.'
            if approved else
            f'Dear {name}, your credit card application could not be approved at this time.'
        )
        html = make_html(
            title   = f'Credit Card Application {icon}',
            greeting= greeting,
            rows    = rows,
            footer_note='Your physical card will be dispatched within 7 working days.' if approved else 'You may reapply after 90 days.',
            color   = color,
        )
        n = send_email(user_id, email,
            f'AND Bank — Your Credit Card Application has been {action.title()}', html)
        return Response({'detail':'sent','id':str(n.id)})


# ── 8. Add Money (Razorpay top-up) ───────────────────────────────
class AddMoneyNotificationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        if not is_internal(request): return Response({'detail':'Forbidden'},status=403)
        user_id    = request.data.get('user_id','')
        email      = request.data.get('email','')
        name       = request.data.get('name','Customer')
        amount     = request.data.get('amount','')
        txn_id     = request.data.get('txn_id','')
        balance    = request.data.get('balance_after','')
        payment_id = request.data.get('payment_id','')

        html = make_html(
            title   = 'Money Added Successfully',
            greeting= f'Dear {name}, money has been added to your AND Bank account.',
            rows    = [
                ('Amount Added',  f'<span style="color:#22c55e;font-size:20px;font-weight:700">₹{amount}</span>'),
                ('Mode',          'Razorpay (Online)'),
                ('Txn ID',        f'<span style="font-family:monospace">{txn_id}</span>'),
                ('Payment ID',    f'<span style="font-family:monospace;font-size:12px">{payment_id}</span>'),
                ('Balance After', f'₹{balance}'),
            ],
            footer_note='If you did not initiate this top-up, contact AND Bank support immediately.',
            color='#22c55e',
        )
        n = send_email(user_id, email,
            f'AND Bank — ₹{amount} Added to Your Account', html)
        return Response({'detail':'sent','id':str(n.id)})