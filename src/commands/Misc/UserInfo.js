const { Command } = require('discord-akairo');
const { MessageEmbed } = require('discord.js');
const config = require('../../config');
const { trimString } = require('../../../lib/util');

class UserInfoCommand extends Command {
    constructor() {
        super('userinfo', {
            aliases: ['userinfo', 'ui'],
            category: 'Miscellaneous',
            description: 'Get information about a user',
            args: [{
                id: 'member',
                type: 'member',
                default: message => message.member
           }]
        });
    }

    async exec(message, args) {
        let member = args.member;
        let userJoinedAt = `${this.client.timeFormat('dddd d MMMM YYYY', member.joinedAt, true)}`;
        let userCreatedAt = `${this.client.timeFormat('dddd d MMMM YYYY', member.user.createdAt, true)}`;
        let userLastMessage;
        if ([undefined, null].includes(member.lastMessage)) {
            userLastMessage = "Last message not found";
        } else { userLastMessage = trimString(member.lastMessage, 30); }
        let embed = new MessageEmbed()
            .setColor(this.client.color)
            .setTitle(`${member.user.tag} User Information`)
            .addField(`• Stats`, `Account created on ${userCreatedAt}\nJoined ${message.guild.name} on ${userJoinedAt}`)
            .addField(`• Information`, `Nickname: ${member.nickname !== null ? `**${member.nickname}**` : '**None**'}\nBannable: ${member.bannable ? '**Yes**' : '**No**'}\nKickable: ${member.kickable ? '**Yes**' : '**No**'}\nBot: ${member.user.bot ? '**Yes**' : '**No**'}\nCustom status: ${member.user.presence.activity && member.user.presence.activity.type === 'CUSTOM_STATUS' ? `${member.user.presence.activity.emoji ? member.user.presence.activity.emoji : ''} ${member.user.presence.activity.state !== null ? `\`${member.user.presence.activity.state}\`` : ''}` : 'No custom status'}\nLast Message: ${userLastMessage}`)
            .addField(`• Highest Role [${member.roles.highest.position}/${message.guild.roles.highest.position}]`, `${member.roles.highest} \`[${member.roles.highest.id}]\``)
            .setFooter(`Requested by ${message.author.username}`)
            .setTimestamp()
        if (member.user.avatarURL() !== null) {
            embed.setThumbnail(member.user.avatarURL({size:512}).replace(/webp/g, 'png').replace(/web?m/g, 'gif'))
        }
        return message.channel.send(embed);        
    }
}

module.exports = UserInfoCommand;