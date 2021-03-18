const { Listener } = require('discord-akairo');

module.exports = class GuildCreateListener extends Listener {
    constructor() {
        super('guildCreate', {
            emitter: 'client',
            event: 'guildCreate'
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
        this.client.log.success(`${this.client.user.username} has been added to the guild ${guild.name}[${guild.id}]`);
        let embed = this.client.util.embed()
            .setColor(this.client.color)
            .setAuthor('Guild', 'https://cdn.discordapp.com/emojis/789938460667412541.png?v=1')
            .setThumbnail(this.client.avatar)
            .setDescription(`${this.client.user.username} has been added to a new guild which has **${guild.memberCount}** members`)
            .addField('Guild', `${guild.name}\n${guild.id}`, true)
            .addField('Owner', `${owner.user.tag}\n${owner.id}`, true)
            .addField('Total guilds', `${this.client.guilds.cache.size}`)
            .setTimestamp()
        this.client.channels.cache.get('789934400930316339').send(embed);
    }
};