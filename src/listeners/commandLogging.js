const { Listener } = require('discord-akairo');

module.exports = class CommandLogging extends Listener {
    constructor() {
        super('commandLogging', {
            emitter: 'commandHandler',
            event: 'commandStarted'
        });
    }

    exec(message, command) {
        if (this.client.verbose) {
            const user = `${message.author.tag}[${message.author.id}]`;
            const cmd = `(${command.id}${message.util.parsed.content ? `, ${message.util.parsed.content}` : ''})`;
            const channel = `#${message.channel.name}[${message.channel.id}]`;
            const guild = `${message.guild.name}[${message.guild.id}]`;
            this.client.log.verbose(user, cmd, channel, guild);
        }
    }
}