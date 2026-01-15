"""
Command to run the Telegram bot.
"""

import logging
import asyncio
from django.core.management.base import BaseCommand
from django.conf import settings
from telegram import BotCommand, Update
from telegram.ext import (
    Application,
    CommandHandler,
    CallbackQueryHandler,
    MessageHandler,
    filters,
    ContextTypes,
)

from telegram_bot import bot as bot_module
from telegram_bot.keyboards import *
from telegram_bot.utils import *


class Command(BaseCommand):
    help = "Run the Telegram bot"

    def handle(self, *args, **options):

        token = getattr(settings, 'TELEGRAM_BOT_TOKEN', None)

        if not token:
            self.stdout.write(
                self.style.ERROR("TELEGRAM_BOT_TOKEN not found in Django settings")
            )
            return

        application = Application.builder().token(token).build()

        application.add_handler(CommandHandler("start", bot_module.start))
        application.add_handler(CommandHandler("help", bot_module.help_command))
        application.add_handler(CommandHandler("profile", bot_module.profile))
        application.add_handler(CommandHandler("cancel", bot_module.cancel))

        # Set the bot commands
        bot_commands = [
            BotCommand(command="/start", description="Start the bot"),
            BotCommand(command="/help", description="Show this help message"),
        ]
        application.bot.set_my_commands(bot_commands)

        # Contact handler
        application.add_handler(
            MessageHandler(filters.CONTACT, bot_module.handle_contact)
        )

        application.add_handler(CallbackQueryHandler(bot_module.button_callback))

        application.add_handler(
            MessageHandler(filters.TEXT & ~filters.COMMAND, bot_module.handle_message)
        )

        try:
            application.run_polling(
                allowed_updates=Update.ALL_TYPES, drop_pending_updates=True
            )
        except KeyboardInterrupt:
            self.stdout.write(self.style.WARNING("\nBot stopped by user"))
