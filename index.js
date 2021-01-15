const Discord = require('discord.js')
const client = new Discord.Client()

const config = require('./config.json')
const Canvas = require('canvas');
const fs = require('fs')
const isImageURL = require('valid-image-url');


let lvls = require('./json/lvls.json')

client.on('ready', () => {
    console.log(client.user.tag + ' is ONLINE!')
    client.user.setActivity('AQUA', {type: 2})
})

client.on('message', async (message) => {
    if(message.channel.type == 'dm') return;
    let cmd_array = message.content.split(' ')
    let cmd = cmd_array[0].toLowerCase()
    let args = cmd_array.slice(1)
    

    if(!lvls[message.author.id]){
        lvls[message.author.id] = {
            lvl: 1,
            xp: 0
        }
    }
    lvls[message.author.id].xp += Math.round(Math.random() * 17)

    if(lvls[message.author.id].xp >= lvls[message.author.id].lvl * 200 && lvls[message.author.id].lvl <= 50){
        lvls[message.author.id].lvl += 1
        lvls[message.author.id].xp = 0
        const embed = new Discord.MessageEmbed()
        .setAuthor(`LVL UP!`)
        .setDescription(`Вы повысили свой урвоень **до ${lvls[message.author.id].lvl}**!`)
        .setColor('#ff22ff')
        message.channel.send(embed)
    }
    
    fs.writeFile('json/lvls.json', JSON.stringify(lvls), (err) => {
        if(err) throw err;
    })

    if(!cmd.startsWith(config.prefix)) return;
    switch (cmd.slice(config.prefix.length)) {
        case 'help':
            const embed = new Discord.MessageEmbed()
            .setAuthor(`Помощь`, message.author.displayAvatarURL({ dynamic: true }))
            .setDescription(`${config.prefix}help - Помощь по командам\n${config.prefix}rank - ваш уровень (ранг)`)
            .setColor('#22ee22')
            if(message.member.hasPermission('ADMINISTRATOR')) embed.addField('Административное', `${config.prefix}setrank <@user> <Новый ранг> - установить ранг пользователю\n${config.prefix}clearr - очистить ранговую систему\n${config.prefix}setimg - установить задний фон картинки`)
            message.channel.send(embed)
            break;
        case 'rank':
            let member = message.mentions.members.first() || message.member
            const canvas = Canvas.createCanvas(700, 250);
            const ctx = canvas.getContext('2d');

            const background = await Canvas.loadImage(config['img-url']);
            ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

            ctx.strokeStyle = '#74037b';
            ctx.strokeRect(0, 0, canvas.width, canvas.height);

            // Select the font size and type from one of the natively available fonts
            ctx.font = '40px sans-serif';
            // Select the style that will be used to fill the text in
            ctx.fillStyle = '#ffffff';
            // Actually fill the text with a solid color
            ctx.fillText(member.displayName, canvas.width / 2.8, canvas.height / 2.8);

            ctx.font = '60px sans-serif';
            // Select the style that will be used to fill the text in
            ctx.fillStyle = '#ffffff';
            // Actually fill the text with a solid color
            ctx.fillText('LVL: ' + lvls[message.author.id].lvl, canvas.width / 2.8, canvas.height / 1.4);

            ctx.beginPath();
            ctx.arc(125, 125, 100, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();

            const avatar = await Canvas.loadImage(member.user.displayAvatarURL({ format: 'jpg' }));
            ctx.drawImage(avatar, 25, 25, 200, 200);

            const attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'welcome-image.png');

            message.channel.send(attachment)
            break
        case 'clearr':
            if(!message.member.hasPermission('ADMINISTRATOR')) return message.channel.send(':x: | Нехватает прав!')
            lvls = {}
            fs.writeFile('json/lvls.json', JSON.stringify(lvls), (err) => {
                if(err) throw err;
            })
            const embed2 = new Discord.MessageEmbed()
            .setAuthor(`Очистка уровней`)
            .setDescription(`${message.author} очистил **уровни на сервере**!`)
            .setColor('#ff2222')
            message.channel.send(embed2)
            break;
        case 'setimg':
            if(!message.member.hasPermission('ADMINISTRATOR')) return message.channel.send(':x: | Нехватает прав!')
            if(!await isImageURL(args[0])) return message.channel.send(':x: | Неправильная ссылка на изображение!')
            config['img-url'] = args[0]
            fs.writeFile('config.json', JSON.stringify(config), (err) => {
                if(err) throw err;
            })
            message.channel.send(':white_check_mark: | Успешно сменил изображение заднего фона!')
            break;
        case 'setrank':
            
            if(!message.member.hasPermission('ADMINISTRATOR')) return message.channel.send(':x: | Нехватает прав!')
            if(!args[0]) return message.channel.send(':x: | Укажите юзера, которому хотите назначить ранг!')
            if(!args[1]) return message.channel.send(':x: | Укажите ранг для юзера!')
            if(isNaN(Number(args[1]))) return message.channel.send(':x: | Укажите ранг для юзера!')
            let muser = message.mentions.users.first()
            if(!muser) return message.channel.send(':x: | Укажите юзера, которому хотите назначить ранг!')
            if(Number(args[1]) < 1 || Number(args[1]) > 50) return message.channel.send(':x: | Ранг можно поставить от 1 до 50!')
            if(!lvls[muser.id]){
                lvls[muser.id] = {
                    lvl: 1,
                    xp: 0
                }
            }
            lvls[muser.id].lvl = Number(args[1])
            const embed3 = new Discord.MessageEmbed()
            .setColor('#22ff22')
            .setTitle('Изменение рангов')
            .setDescription(`${message.author} изменил ранг ${muser} **на ${args[1]}**!`)
            message.channel.send(embed3);
            fs.writeFile('json/lvls.json', JSON.stringify(lvls), (err) => {
                if(err) throw err;
            })
            break;
        default:
            break;
    }
})

client.login(config.token)