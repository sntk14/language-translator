
class PostFixAnalizer {
	constructor(postfixCode,identTable, debug) {
		this.postfixCode = postfixCode
		this.identTable = identTable
		this.isView = debug
		this.step = 1
		this.stack = []
	}

	postfixProcess(){
		let length = this.postfixCode.length
		try {
			for(let i = 0; i < length; i++) {
				if (['int', 'float', 'ident','keyword'].includes(this.postfixCode[i].token)) {
					this.stack.push(this.postfixCode[i])
				} else {
					this.doIt(this.postfixCode[i], i)
				}
				if(this.isView) {
					this.viewLog()
					this.step++
				}
			}
			if(this.isView) {
				this.getIdents()
			}
		}
		catch (e){
			console.log(e)
		}
	}

	getType (n) {
		return Number(n) == n && n % 1 === 0 ? 'int' : 'float'
	}

	checkType (type,oneLast) {
		if(this.getType(oneLast.lexeme) == type.lexeme) return true//типы совпадают
		if(type.lexeme == 'float') return true

		return false
	}

	doIt(el,ind){
		if(el.lexeme == '='){
			let oneLast = this.stack.pop()//переменная
			let last= this.stack.pop()//значение
			let type = this.stack.pop()//значение

			//проверка на типизацию и присваивание
			// if(this.getType(oneLast.lexeme) == type.lexeme) {
			if(this.checkType(type, oneLast)){
				let ind = this.identTable.findIndex(i => i.value == last.lexeme)
				if(ind < 0) throw 'Використана невідома змінна'
				this.identTable[ind].letValue = oneLast.lexeme
			} else {
				throw `Невідповідність типів присвоювання у ${last.row} рядку`
			}

		}
		else if (['add_op','mult_op','degr_op'].includes(el.token)){
			let last = this.stack.pop()
			let oneLast = this.stack.pop()

			last.lexeme = this.isIdent(last)
			oneLast.lexeme = this.isIdent(oneLast)

			let lexeme = 0
			switch (el.lexeme){
				case '+':
					lexeme = parseInt(oneLast.lexeme)+parseInt(last.lexeme)
					break
				case '-':
					lexeme = parseInt(oneLast.lexeme)-parseInt(last.lexeme)
					break
				case '*':
					lexeme = parseInt(oneLast.lexeme)*parseInt(last.lexeme)
					break
				case '/':
					if (last.lexeme == 0) throw `Ділення на 0 ${last.row} рядку`
					lexeme = parseInt(oneLast.lexeme)/parseInt(last.lexeme)
					break
				case '^':
					lexeme = Math.pow(parseInt(oneLast.lexeme),parseInt(last.lexeme))
					break
			}
			let token = this.getType(lexeme)
			this.stack.push({token, lexeme, row: last.row})
		}

		return true
	}

	isIdent (ident){
		if(ident.token == 'ident') {
			let ind = this.identTable.findIndex(i => i.value == ident.lexeme)

			if (this.identTable[ind].letValue == undefined) throw `Використано неіціалізовану змінну ${ident.row} рядку`

			return this.identTable[ind].letValue
		}
		return ident.lexeme
	}

	changeDegr(){
		let ind = this.postfixCode.findIndex(el => el.lexeme == '^')
		if(ind >= 0){
			this.postfixCode[ind+1].token = 'int'

			let ind2 = this.identTable.findIndex(i => i.lexeme == '^')
			this.identTable[ind2+1].type = 'int'
		}
	}

	getInPOLIZWrire(el){
		// if(el.lexeme != 'int' && el.lexeme != 'float')
			return el.lexeme
	}

	viewLog() {
		console.log(`Крок інтерпретації: ${this.step} \n 
		postfixCode: [${this.postfixCode.map(el => this.getInPOLIZWrire(el))}] \n 
		STACK:[${this.stack.map(el => this.getInPOLIZWrire(el))}]`)
	}
	getIdents(){
		console.log(this.identTable.filter(el => {
			if(el.type == 'ident'){
				return el
			}
		}))
	}

}