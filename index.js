const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');

dotenv.config();

const token = process.env.TG_TOKEN;
const bot = new TelegramBot(token, { polling: true });
const groupId = process.env.GROUP_ID;

const chatData = {};
const languages = ["🇬🇧 Английский", "🇷🇺 Русский", "🇹🇯 Таджикский"];

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const welcomeMessage = "Добро пожаловать! Давайте начнем процесс заказа.";

    bot.sendMessage(chatId, welcomeMessage);

    chatData[chatId] = { state: 'chooseLanguage' };

    sendLanguageSelection(chatId);
});


bot.on('message', (msg) => {

    const chatId = msg.chat.id;
    const messageText = msg.text;

    let { state } = chatData[chatId] || {};
    if (!state && messageText) {
        console.log({messageText}, languages.includes(messageText))
        if (languages.includes(messageText)) {
            state = "chooseLanguage";
        }
    }
    console.log({state, messageText});
    if (state === "chooseLanguage") {
        if (!chatData[chatId]) chatData[chatId] = {};
        chatData[chatId].language = messageText;
    }
    if (state === "provideName") {
        chatData[chatId].author_name = messageText;
    }
    if (state === "providePhoneNumber") {
        chatData[chatId].author_phone = messageText;
    }
    if (state === "provideReceiverAddress") {
        chatData[chatId].receiver_phone = messageText;
    }
    if (state === "provideSenderAddress") {
        chatData[chatId].sender_address = messageText;
    }
    if (state === "provideRecipientAddress") {
        chatData[chatId].receipent_address = messageText;
    }
    if (state === "chooseWeightAndOptions") {
        chatData[chatId].options = messageText;
    }
    if (state === "chooseDeliveryTime") {
        chatData[chatId].time = messageText;
    }
    switch (state) {
        case 'chooseLanguage':
            processLanguageSelection(chatId, messageText);
            break;
        case 'provideName':
            processNameProviding(chatId, messageText);
            break;
        case 'providePhoneNumber':
            processPhoneNumberProviding(chatId, messageText);
            break;
        case 'provideReceiverAddress': 
            processReceiverPhoneNumber(chatId, messageText);
            break;
        case 'provideSenderAddress':
            processSenderAddressProviding(chatId, messageText);
            break;
        case 'provideRecipientAddress':
            processRecipientAddressProviding(chatId, messageText);
            break;
        case 'chooseWeightAndOptions':
            processWeightAndOptionsSelection(chatId, messageText);
            break;
        case 'chooseDeliveryTime':
            processDeliveryTimeSelection(chatId, messageText);
            break;
        case 'completeOrder': 
            processCompleteOrder(chatId);
            break;

        default:
            break;
    }
});

function sendLanguageSelection(chatId) {
    const languageOptions = [
        [{ text: '🇹🇯 Таджикский' }, { text: '🇬🇧 Английский' }, { text: '🇷🇺 Русский' }]
    ];
    const opts = {
        reply_markup: JSON.stringify({
            keyboard: languageOptions,
            resize_keyboard: true
        })
    };
    bot.sendMessage(chatId, "Выберите язык:", opts);
}

function processLanguageSelection(chatId, language) {
    chatData[chatId].state = 'provideName';
    bot.sendMessage(chatId, "Введите ваше имя:", {
        reply_markup: {
            keyboard: [['В начало']],
            resize_keyboard: true
        }
    });
}

function processNameProviding(chatId, name) {
    chatData[chatId].state = 'providePhoneNumber';
    bot.sendMessage(chatId, "Введите ваш номер телефона:",{
        reply_markup: {
            keyboard: [['В начало']],
            resize_keyboard: true
        }
    });
}

function processPhoneNumberProviding(chatId, phoneNumber) {
    chatData[chatId].state = 'provideReceiverAddress';
    bot.sendMessage(chatId, "Введите номер получателя:", {
        reply_markup: {
            keyboard: [['В начало']],
            resize_keyboard: true
        }
    });
}

function processReceiverPhoneNumber(chatId, phoneNumber) {
    chatData[chatId].state = 'provideSenderAddress';
    bot.sendMessage(chatId, "Введите адрес отправителя:", {
        reply_markup: {
            keyboard: [['В начало']],
            resize_keyboard: true
        }
    });
}

function processSenderAddressProviding(chatId, senderAddress) {
    chatData[chatId].state = 'provideRecipientAddress';
    bot.sendMessage(chatId, "Введите адрес получателя:", {
        reply_markup: {
            keyboard: [['В начало']],
            resize_keyboard: true
        }
    });
}

function processRecipientAddressProviding(chatId, recipientAddress) {
    chatData[chatId].state = 'chooseWeightAndOptions';
    bot.sendMessage(chatId, "Выберите приблизительный вес и опции:", {
        reply_markup: {
            keyboard: [['В начало']],
            resize_keyboard: true
        }
    });
}

function processWeightAndOptionsSelection(chatId, weightAndOptions) {
    chatData[chatId].state = 'chooseDeliveryTime';
    bot.sendMessage(chatId, "Выберите удобное время отправки заказа:", {
        reply_markup: {
            keyboard: [['В начало']],
            resize_keyboard: true
        }
    });
}

function processDeliveryTimeSelection(chatId, deliveryTime) {
    chatData[chatId].state = 'completeOrder';
    bot.sendMessage(chatId, "Выберите время доставки:");
    const sendingMessage = generateSendingMessage(chatData[chatId]);
    const speedingMessage = `Если у вас срочная доставка и необходимо ускорить процесс доставки, вы можете увеличить стоимость доставки, в таком случае мы отправим вашу заявку в ускоренном темпе
    Для этого пожалуйста позвоните по номеру 888110073
`
    bot.sendMessage(chatId, `Пожалуйста, подтвердите правильность введенных данных:
        ${sendingMessage}
        ${speedingMessage}
    `, {
        reply_markup: {
            keyboard: [['Подтверждаю']],
            resize_keyboard: true
        }
    });
}

function processCompleteOrder(chatId, deliveryTime) {
    bot.sendMessage(chatId, "Спасибо за ваш заказ. Мы свяжемся с вами для уточнения деталей.", {
        reply_markup: {
            keyboard: [['Сделать новый заказ']],
            resize_keyboard: true
        }
    });
    
    sendMessageToGroup((chatData[chatId]));

    delete chatData[chatId];
}

bot.onText(/Сделать новый заказ/, (msg) => {
    bot.sendMessage(msg.chat.id, "Добро пожаловать! Давайте начнем новый заказ.");
    chatData[msg.chat.id] = { state: 'chooseLanguage' };
    sendLanguageSelection(msg.chat.id);
});

bot.onText(/В начало/, (msg) => {
    bot.sendMessage(msg.chat.id, "Добро пожаловать! Давайте начнем новый заказ.");

    chatData[msg.chat.id] = { state: 'chooseLanguage' };
    sendLanguageSelection(msg.chat.id);
});

function generateSendingMessage (message) {
    const { language, author_name, author_phone, receiver_phone, receipent_address, options, time, sender_address, price = 20 } = message;

    const sendingMessage = `
    Язык: ${language},
    Имя отправителя: ${author_name},
    Номер отправителя: ${author_phone},
    Адрес отправителя: ${sender_address},
    Номер получателя: ${receiver_phone},
    Адрес получаетеля: ${receipent_address},
    Время: ${time},
    Комментарии отправителя: ${options},
    Стоимость доставки: ${price} сомони. 
    `

    return sendingMessage;
};

function sendMessageToGroup(message) {
    const sendingMessage = generateSendingMessage(message);
    bot.sendMessage(groupId, sendingMessage);
}