# Generated by Django 4.2.16 on 2024-10-07 03:32

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('appointment_management', '0006_alter_availability_referee'),
    ]

    operations = [
        migrations.AlterField(
            model_name='availability',
            name='referee',
            field=models.ForeignKey(on_delete=django.db.models.deletion.DO_NOTHING, to='appointment_management.referee'),
        ),
        migrations.AlterUniqueTogether(
            name='availability',
            unique_together={('availableID', 'referee')},
        ),
    ]
