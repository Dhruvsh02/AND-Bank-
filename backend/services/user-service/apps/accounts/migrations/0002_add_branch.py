from django.db import migrations, models


class Migration(migrations.Migration):
    """
    Safely adds 'branch' column if it doesn't exist.
    This fixes the 500 error: Unknown column 'bank_accounts.branch'
    """

    dependencies = [
        ('user_accounts', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='bankaccount',
            name='branch',
            field=models.CharField(default='Mumbai Main', max_length=100),
            preserve_default=True,
        ),
    ]