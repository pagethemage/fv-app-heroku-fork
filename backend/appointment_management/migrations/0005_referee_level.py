# Generated by Django 4.2.16 on 2024-09-26 08:33

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('appointment_management', '0004_remove_referee_level_referee_date_of_birth_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='referee',
            name='level',
            field=models.CharField(choices=[('0', 'Trainee'), ('1', 'Level 1'), ('2', 'Level 2'), ('3', 'Level 3'), ('4', 'Level 4')], default='0', max_length=1),
        ),
    ]
