const { Listener } = require('discord-akairo');

module.exports = class GuildDeleteListener extends Listener {
    constructor() {
        super('guildDelete', {
            emitter: 'client',
            event: 'guildDelete'
        });
    }

    async exec(guild) {
        this.client.presence.set({
            status: 'online',
            activity: {
                name: `${this.client.guilds.cache.size} guilds`,
                type: 'WATCHING'
            }
        });
        let fetch = this.client.users.fetch(guild.owner.id);
        let owner = this.client.users.cache.get(fetch.id);
        this.client.log.success(`${this.client.user.username} has been removed from the guild ${guild.name}[${guild.id}]`);
        let embed = this.client.util.embed()
            .setColor(this.client.color)
            .setAuthor('Guild', 'https://cdn.discordapp.com/emojis/789938481904353290.png?v=1')
            .setThumbnail(this.client.avatar)
            .setDescription(`${this.client.user.username} has been removed from a guild which had **${guild.memberCount}** members`)
            .addField('Guild', `${guild.name}\n${guild.id}`, true)
            .addField('Owner', `${owner.user.tag}\n${owner.id}`, true)
            .addField('Total guilds', `${this.client.guilds.cache.size}`)
            .setTimestamp()
        this.client.channels.cache.get('789934400930316339').send(embed);
    }
};