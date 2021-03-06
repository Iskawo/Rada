const { Structures } = require('discord.js');
const model = require('../../src/models/memberSchema');
const { MongooseProvider } = require('discord-akairo');

Structures.extend('GuildMember', Member => {
	class RadaMember extends Member {
		constructor(...args) {
			super(...args);
            this.settings = new MongooseProvider(model);
			this.settings.init();
			this.addWarn = async (warnCase) => {
				let array = [];
				let db = this.settings.get(this.id, 'warnings', array);
				if (db.length < 1) {
					array.push(warnCase);
				} else {
					for(let i = 0; i < db.length; i++) {
						array.push(db[i]);
					}
					array.push(warnCase);
				}
				await this.settings.set(this.id, 'warnings', array);
			}
			this.clearWarns = () => {
				this.settings.reset(this.id, 'warnings');
				return true;
			}
			this.addTDL = async (content) => {
				let array = [];
				let db = this.settings.get(this.id, 'todolist', array);
				if (db.length < 1) {
					array.push(content);
				} else {
					for(let i = 0; i < db.length; i++) {
						array.push(db[i]);
					}
					array.push(content);
				}
				await this.settings.set(this.id, 'todolist', array);
			}
			this.clearTDL = () => {
				this.settings.reset(this.id, 'todolist');
				return true;
			}
		}
	}
	return RadaMember;
});
