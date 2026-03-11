from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('user_accounts', '0002_add_branch'),
    ]
    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='mpin_hash',
            field=models.CharField(blank=True, max_length=256),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='mpin_set',
            field=models.BooleanField(default=False),
        ),
    ]
