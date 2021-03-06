const { Listener } = require('discord-akairo');

module.exports = class roleDelete extends Listener {
    constructor() {
        super('roleDelete', {
            emitter: 'client',
            event: 'roleDelete',
        })
    }
    async exec(role) {
        let muterole = await role.guild.settings.get(role.guild.id, 'muterole', null);
        if (muterole && role.id === muterole) {
            await role.guild.settings.reset('muterole');
        }
        let RoleDeleteEmote = this.client.emojis.cache.find(e => e.name === "role_delete");
        let logs = role.guild.channels.cache.get(role.guild.settings.get(role.guild.id, 'logs'));
        let embed = this.client.util.embed()
            .setColor(this.client.color)
            .setAuthor('Role deleted', RoleDeleteEmote.url)
            .addField('Name', role.name, true)
            .addField('ID', role.id, true)
            .setTimestamp()
        if (logs) {
            logs.send(embed)
        }
    }
}