from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ("daybook", "0001_initial"),
    ]

    operations = [
        migrations.RenameField(
            model_name="daybook",
            old_name="expense",
            new_name="amount",
        ),

        migrations.RenameField(
            model_name="daybook",
            old_name="notes",
            new_name="description",
        ),

        migrations.AddField(
            model_name="daybook",
            name="transaction_type",
            field=models.CharField(
                max_length=20,
                choices=[
                    ("Income", "Income"),
                    ("Expense", "Expense"),
                ],
                default="Expense",
            ),
            preserve_default=False,
        ),

        migrations.AddField(
            model_name="daybook",
            name="category",
            field=models.CharField(
                max_length=100,
                default="Other",
            ),
            preserve_default=False,
        ),

        migrations.AddField(
            model_name="daybook",
            name="created_at",
            field=models.DateTimeField(
                default=django.utils.timezone.now,
            ),
            preserve_default=False,
        ),

        migrations.RemoveField(
            model_name="daybook",
            name="income",
        ),
    ]