// NPM Packages
const { Timestamp } = require('@skyra/timestamp');
const Flipnote = require('alexflipnote.js');
const google = require('google-it');
const {
    AkairoClient,
    CommandHandler,
    ListenerHandler,
    InhibitorHandler,
    MongooseProvider
} = require('discord-akairo');
const { Intents } = require('discord.js');
// Custom classes
const { clientColor, logo, christmasLogo, id } = require('./lib/constants');
const RadaScheduler = require('./lib/classes/RadaScheduler');
const model = require('./src/models/clientSchema');
const Util = require('./lib/structures/Util');
const Cli = require('./lib/classes/Cli');
const Logger = require('./lib/log');

// Configuration
const config = require('./src/config');
const server = require('./lib/api/RadaAPI');
const WebSocket = require('ws');
const constants = require('./lib/constants');
require('dotenv').config();
// Instantiating extensions
require('./lib/extensions');

class RadaClient extends AkairoClient {
    constructor() {
        super({
            ownerID: config.owners
        }, {
            disableMentions: 'everyone',
            fetchAllMembers: false,
            allowedMentions: {
                repliedUser: false
            },
            partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'GUILD_MEMBER', 'USER'],
            intents: [
                Intents.FLAGS.GUILDS,
                Intents.FLAGS.GUILD_MESSAGES,
                Intents.FLAGS.GUILD_MEMBERS,
                Intents.FLAGS.GUILD_BANS,
                Intents.FLAGS.GUILD_MESSAGES,
                Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
                Intents.FLAGS.GUILD_VOICE_STATES,
                Intents.FLAGS.GUILD_EMOJIS
            ]
        });
        let api = new server.RadaAPI(this).setup();
        api.listen(config.ApiPort, () => {
            this.log.success("Rada API online")
        });
        this.settings = new MongooseProvider(model);
        this.RadaReminder = new RadaScheduler(this);
        this.commandHandler = new CommandHandler(this, {
            directory: './src/commands/',
            prefix: (message) => {
                if (message.guild) {
                    return this.settings.get(message.guild.id, 'prefix', message.guild.prefix)
                }
                return config.production ? config.prefix : config.devPrefix;
            },
            ignoreCooldown: [],
            blockBots: true,
            allowMention: true,
            handleEdits: true,
            commandUtil: true
        });
        this.inhibitorHandler = new InhibitorHandler(this, {
            directory: './src/inhibitors/'
        });
        this.listenerHandler = new ListenerHandler(this, {
            directory: './src/listeners/'
        });
        this.listenerHandler.setEmitters({
            commandHandler: this.commandHandler,
            inhibitorHandler: this.inhibitorHandler,
            listenerHandler: this.listenerHandler
        });
        this.commandHandler.useInhibitorHandler(this.inhibitorHandler);
        this.commandHandler.useListenerHandler(this.listenerHandler);
        this.listenerHandler.loadAll();
        this.inhibitorHandler.loadAll();
        this.commandHandler.loadAll();
        this.color = clientColor;
        this.avatar = new Date().getMonth() === 11 ? christmasLogo : logo;
        this.setMaxListeners(30);
        this.log = new Logger;
        this.Cli = new Cli(this);
        this.Util = Util;
        this.flipnote = new Flipnote(process.env.FLIPNOTE);
        this.Timestamp = Timestamp;
        this.id = id;
        this.defaultPrefix = config.production ? config.prefix : config.devPrefix;
        this.contributorRole = '789310316105170945';
    }
    async login(token) {
        await this.settings.init();
        await super.login(token);
    }

    async search(query, results) {
        return await google({ 'query': query, 'no-display': true, 'limit': results });
    }

    convertTemp(temp) {
        return {
            CtoF: Number((temp * 9 / 5 + 32).toFixed(1)),
            FtoC: Number(((temp - 32) * 5 / 9).toFixed(1))
        }
    }

    daysBetween(startDate, endDate) {
        if (!endDate) endDate = Date.now();
        const treatAsUTC = (date) => {
            let result = new Date(date);
            result.setMinutes(result.getMinutes() - result.getTimezoneOffset());
            return result;
        };
        let millisecondsPerDay = 24 * 60 * 60 * 1000;
        return (treatAsUTC(endDate) - treatAsUTC(startDate)) / millisecondsPerDay;
    }
    chunkify(input, chunkSize) {
        const output = [];
        for (let i = 0; i < input.length; i += chunkSize) {
            output.push(input.slice(i, i + chunkSize));
        }
        return output;
    }
    timeFormat(ts, date, encased = false, days = false) {
        const timestamp = new Timestamp(ts);
        const daysSince = this.daysBetween(date).toFixed(0);
        if (encased) {
            return days ? `${timestamp.display(date)} [${daysSince} day${daysSince !== 1 ? 's' : ''} ago]` : timestamp.display(date);
        }
        return days ? `${timestamp.display(date)}\n${daysSince} day${daysSince !== 1 ? 's' : ''} ago` : timestamp.display(date);
    }
    reverse(str) {
        return str.split("").reverse().join("");
    }
    convertMs(time, song = false) {
        const conversion = (ms) => {
            let d, h, m, s;
            s = Math.floor(ms / 1000);
            m = Math.floor(s / 60);
            s = s % 60;
            h = Math.floor(m / 60);
            m = m % 24;
            d = Math.floor(h / 24);
            h = h % 24;
            return {
                d: d,
                h: h,
                m: m,
                s: s
            };
        };
        let u = conversion(time);
        let uptime;
        let ms_song;
        if (u.s) uptime = `${u.s} second${u.s < 2 ? '' : 's'}`;
        if (u.m) uptime = `${u.m} minute${u.m > 0 && u.m < 2 ? '' : 's'} and ${u.s} second${u.s > 0 && u.s < 2 ? '' : 's'}`;
        if (u.h) uptime = `${u.h} hour${u.h > 0 && u.h < 2 ? '' : 's'}, ${u.m} minute${u.m > 0 && u.m < 2 ? '' : 's'} and ${u.s} second${u.s > 0 && u.s < 2 ? '' : 's'}`;
        if (u.d) uptime = `${u.d} day${u.d > 0 && u.d < 2 ? '' : 's'}, ${u.h} hour${u.h > 0 && u.h < 2 ? '' : 's'}, ${u.m} minute${u.m > 0 && u.m < 2 ? '' : 's'} and ${u.s} second${u.s > 0 && u.s < 2 ? '' : 's'}`;

        if (u.s) ms_song = `00:${u.s < 10 ? '0' + u.s : u.s}`;
        if (u.m) ms_song = `${u.m < 10 ? '0' + u.m : u.m}:${u.s < 10 ? '0' + u.s : u.s}`;
        if (u.h) ms_song = `${u.h < 10 ? '0' + u.h : u.h}:${u.m < 10 ? '0' + u.m : u.m}:${u.s < 10 ? '0' + u.s : u.s}`;
        if (u.d) ms_song = `${u.d < 10 ? '0' + u.d : u.d}:${u.h < 10 ? '0' + u.h : u.h}:${u.m < 10 ? '0' + u.m : u.m}:${u.s < 10 ? '0' + u.s : u.s}`;

        return song ? ms_song : uptime;
    }
    emojify(text) {
        const specialCodes = constants.specialCodes;
        return text.toLowerCase().split('').map(letter => {
            if (/[a-z]/g.test(letter)) {
                return `:regional_indicator_${letter}: `
            } else if (specialCodes[letter]) {
                return `${specialCodes[letter]} `
            }
            return letter
        }).join('');
    }
    leet(text) {
        const leetMap = constants.leetMap;
        return text
            .split('')
            .map(char => leetMap[char.toLowerCase()] ? mappedChar['translated'] : char).join('');
    }
    toggleCase(str) {
        if (str.length !== 1) return str;
        if (str.match(/^[A-z]$/)) {
            if (str.toUpperCase() === str) {
                return str.toLowerCase();
            } else {
                return str.toUpperCase();
            }
        }
        return str;
    }
    mock(str) {
        return str.split("").map((char, index) => {
            if (index % 2 === 0) return this.toggleCase(char);
            return char;
        }).join("");
    }

    generateEmojipasta(text) {
        var blocks = this.splitIntoBlocks(text);
        var newBlocks = [];
        var emojis = [];
        blocks.forEach(block => {
            newBlocks.push(block);
            emojis = this.generateEmojisFrom(block);
            if (emojis) {
                newBlocks.push(" " + emojis);
            }
        });
        return newBlocks.join("");
    }
    
    splitIntoBlocks(text) {
        return text.match(/\s*[^\s]*/g);
    }
    
    generateEmojisFrom(block) {
        var trimmedBlock = this.trimNonAlphanumericalChars(block);
        var matchingEmojis = this.getMatchingEmojis(trimmedBlock);
        var emojis = [];
        if (matchingEmojis) {
            var numEmojis = Math.floor(Math.random() * (1 + 1));
            for (var i = 0; i < numEmojis; i++) {
                emojis.push(matchingEmojis[Math.floor(Math.random() * matchingEmojis.length)]);
            }
        }
        return emojis.join("");
    }
    
    trimNonAlphanumericalChars(text) {
        return text.replace(/^\W*/, "").replace(/\W*$/, "");
    }
    
    getMatchingEmojis(word) {
        const emoji_mapping = require("./lib/structures/EmojiMappings").emojiMap;
        var key = this.getAlphanumericPrefix(word.toLowerCase());
        if (key in emoji_mapping) {
            return emoji_mapping[key];
        }
        return [];
    }
    
    getAlphanumericPrefix(s) {
        return s.match(/^[a-z0-9]*/i);
    }    
    owofy(string) {
        const { OwOfy } = require('./lib/constants')
        let i = Math.floor(Math.random() * OwOfy.length);

        string = string.replace(/(?:l|r)/g, 'w');
        string = string.replace(/(?:L|R)/g, 'W');
        string = string.replace(/n([aeiou])/g, 'ny$1');
        string = string.replace(/N([aeiou])/g, 'Ny$1');
        string = string.replace(/N([AEIOU])/g, 'Ny$1');
        string = string.replace(/ove/g, 'uv');
        string = string.replace(/!+/g, ` ${OwOfy[i]} `);
        string = string.replace(/\.+/g, ` ${OwOfy[i]} `);
        string = string.replace(/~+/g, ` ${OwOfy[i]} `);

        return string;
    };
    vaporwave(text) {
        const vaporwaveMap = constants.vaporwaveMap;
        return text.split('')
            .map(char => {
                const mappedChar = vaporwaveMap[char.toLowerCase()];
                return mappedChar ? mappedChar['translated'] : char
            }).join(' ').replace(/\s/g, '  ');
    }
}
const client = new RadaClient();
// client.Cli.start()
client.login(process.env.TOKEN);