
class SyncAnalizer {
	constructor(lexTable, identTable, debug){
		this.lexTable = lexTable
		this.identTable
		this.row = 0
		this.level = 0
		this.postfixCode = []
		this.isBracket = 0//таблиця ПОЛІЗу
		this.isViewPOLIZSteps = debug
		this.POLIZStep = 1
		this.isSetPostfixCode = 1
	}

	getInPOLIZWrire(el){
		// if(el.lexeme != 'int' && el.lexeme != 'float')
		return el.lexeme
	}

	setPostfixCode(lexeme){
		if(this.isSetPostfixCode) {
			this.postfixCode.push(lexeme)
			if (this.isViewPOLIZSteps) {
				console.log(`Крок трансляцiї:${this.POLIZStep} \n Лексема: ${this.getInPOLIZWrire(lexeme)} \n postfixCode: [${this.postfixCode.map(el => this.getInPOLIZWrire(el))}] \n`)
				if (lexeme != 'int' && lexeme != 'float') this.POLIZStep++
			}
		}
	}

	parseProgram(){
		try {
			this.parseToken('main','keyword')
			this.parseToken('{','brackets_op')
			this.parseStatementList()
			this.parseToken('}','brackets_op')
			if (this.isViewPOLIZSteps) console.log(this.postfixCode)
			console.log('Успішне завершення синтаксичного аналізатора!')
		} catch (e) {
   			this.failParse(e); 
   			throw 'Синтаксичний аналізатор аварійно завершив роботу!'
		}
	}

	parseToken(lexeme, token, ident){
		if(this.row > (this.lexTable.length - 1)) throw `Помилка: очікували ${lexeme} [${token}]` //this.failParse(lexeme, token,this.row)

		let lexRow = this.getSymb()
		//this.logger()
		if(lexRow.token == token && lexRow.lexeme == lexeme){
			this.addRow()
			return true
		} else {
			throw `Hевідповідність токенів, маємо ${lexRow.lexeme}[${lexRow.token}] у рядку ${lexRow.row}`;// , а очікували: ${lexeme}[${token}]
		}
	}

	getSymb(row = false){
		if(this.row > (this.lexTable.length - 1)) {
			let lex = this.lexTable[this.row-1] 			
			throw `Помилка взяття символа після ${lex.lexeme} у рядку [${lex.row}]`
		} //this.failParse(lexeme, token,this.row)

		if(row)return this.lexTable[row] 

		return this.lexTable[this.row]
	}

	failParse(e){
		console.log(e)
		if(this.row < (this.lexTable.length - 1)) {
			// console.log(`ROW: ${this.row} LENGHT: ${this.lexTable.length}`)
		let lexRow = this.getSymb(this.row)
	//	console.log(`Помилка: у ${lexRow.row} рядку неочікуваний символ ${lexRow.lexeme}`)
		}
	}

	addRow(){
		this.row++
	}

	addLevel(){
		this.level++
	}

	subLevel(){
		this.level--
	}

	parseStatementList(){
			while(this.parseStatement() ) {
				true//this.addRow()
			}
	}


	parseStatement(){
		let lexRow = this.getSymb()

		if(this.checkLexToken(lexRow,{lexeme:'if', token:'keyword'})){
			this.parseIf()
			return true
		}

			if(this.checkLexToken(lexRow,{lexeme:'for', token:'keyword'})){
			this.parseFor()
			return true
		}

		if(this.checkLexToken(lexRow,{lexeme:'int', token:'keyword'}) ||
			this.checkLexToken(lexRow,{lexeme:'float', token:'keyword'})||
			this.checkLexToken(lexRow,{lexeme:'bool', token:'keyword'})){

			this.parseAssign()
			this.addRow()
			return true
		}
		if(lexRow.token == 'ident'){
			this.parseAssign()

			this.addRow()
			return true
		}
		if(lexRow.token == 'nl'){
			this.addRow()
			return true
		}
		if(this.checkLexToken(lexRow,{lexeme:'echo', token:'keyword'}) ||
			this.checkLexToken(lexRow,{lexeme:'read', token:'keyword'}) ){
			
			this.parseFunction()
			this.addRow()

			return true
		}
	

		return false
	}


	checkLexToken(lexRow, {lexeme,token}){
		if(lexRow.token == token && lexRow.lexeme == lexeme)return true
			
		return false
	}



    parseAssign(){
	    let lexRow = this.getSymb()
		// this.setPostfixCode(lexRow)
		if(lexRow.lexeme == 'int' || lexRow.lexeme == 'float'){
			this.setPostfixCode(lexRow)
			this.logger('ExpAssign Statement')
			this.addRow()
			lexRow = this.getSymb()
			if (!this.getSymb().token == 'ident') throw `У рядку ${this.getSymb().row} має бути змінна`
			this.addRow()
			this.parseToken('=','assign_op')
			this.setPostfixCode(lexRow)
			this.parseExpression()
			this.setPostfixCode({lexeme:'='})
		}  else if(lexRow.lexeme == 'bool') {
			this.logger('BoolAssign Statement')
			this.addRow()
			if (!this.getSymb().token == 'ident') throw `У рядку ${this.getSymb().row} має бути змінна`
			this.addRow()
			this.parseToken('=','assign_op')
			this.parseBoolExpr()
			// this.setPostfixCode({lexeme:'='})
			// this.postfixCode..push(lexRow.lexeme)
		} else if (lexRow.token == 'ident') {
			this.logger('ReAssign Statement')
			this.addRow()
			this.parseToken('=','assign_op')
			this.setPostfixCode(lexRow)
			this.parseExpression()
			this.setPostfixCode({lexeme:'='})
		} else {
			return false
		}
		return true 
	}
	


	parseExpression(){
	    let lexRow = this.getSymb()
	    this.parseFactor()
	    let F = true
	    while (F) {
	        lexRow = this.getSymb()
	        if (['add_op'].includes(lexRow.token)){
	            this.addRow()
				this.parseFactor()
				if (['add_op'].includes(lexRow.token)) this.setPostfixCode(lexRow)
			}
	        else{
	            F = false
	        }
	    }
	    return true
	}

	parseFactor(){
	    let lexRow = this.getSymb()
	    this.parseFactor1()
	    let F = true
	    while (F) {
	        lexRow = this.getSymb()
	        if (['mult_op'].includes(lexRow.token)){
	            this.addRow()
				this.parseFactor1()
				if (['mult_op'].includes(lexRow.token)) this.setPostfixCode(lexRow)
	        }
	        else{
	            F = false
	        }
	    }
	    return true
	}

	parseFactor1(){
	    let lexRow = this.getSymb()
	    this.parseTemp()
	    let F = true
	    while (F) {
	        lexRow = this.getSymb()
	        if (['degr_op'].includes(lexRow.token)){
	            this.addRow()
				this.parseTemp()
				if (['degr_op'].includes(lexRow.token)) this.setPostfixCode(lexRow)
	        }
	        else{
	            F = false
	        }
	    }
	    return true
	}


	parseTemp(){
	    let lexRow = this.getSymb()

	    if (['int','float','ident'].includes(lexRow.token)){
	            this.addRow()
	     } else if  (lexRow.lexeme =='(') {
			this.isBracket++
	        this.addRow()
	        this.parseExpression()
	        this.parseToken(')','brackets_op')

			this.isBracket--
	    }
	    else{
	    	throw 'невідповідність у Expression.Factor'
	  	}

		if(lexRow.lexeme != '('){
			this.setPostfixCode(lexRow)
		}
	    return true
	}


	parseFor(){
		let lexRow = this.getSymb()
		if(lexRow.lexeme == 'for'){
			this.logger('For Statement')
			this.addRow()
			this.parseAssign()
			this.parseToken('to','keyword')
			this.isSetPostfixCode = 0//не добавлять в полиз
			this.parseExpression()
			this.parseToken('step','keyword')
			this.parseExpression()
			this.isSetPostfixCode = 1//добавлять)
			this.parseToken('do','keyword')
			this.logger('Statement List:')
			this.addLevel()
			this.parseStatementList()
			this.subLevel()
			this.parseToken('next','keyword')
		}
	}

	parseFunction(){
		let lexRow = this.getSymb()
		if(lexRow.lexeme == 'echo' || lexRow.lexeme == 'read'){
			this.logger('Read/Echo Statement')
			this.addRow()
			this.parseToken('(','brackets_op')
			this.isSetPostfixCode = 0//TODO
			this.parseExpression()
			this.isSetPostfixCode = 1//TODO
			this.parseToken(')','brackets_op')
		}
	}

	parseIf(){
		let lexRow = this.getSymb()
		if(lexRow.lexeme == 'if'){
			this.logger('If Statement')
			this.addRow()
			this.isSetPostfixCode = 0
			this.parseBoolExpr()
			this.isSetPostfixCode = 1
			this.parseToken('then','keyword')
			this.logger('Statement List:')
			this.addLevel()
			this.parseStatementList()
			this.subLevel()
			this.parseToken('else','keyword')
			this.logger('Statement List:')
			this.addLevel()
			this.parseStatementList()
			this.subLevel()
			this.parseToken('endif','keyword')
			return true
		}
		return false

	}


	parseBoolExpr(){
		let lexRow = this.getSymb()
		if(lexRow.lexeme == 'false' || lexRow.lexeme == 'true'){
			this.addRow()
			// this.setPostfixCode(lexRow)
			return true
		}

		this.parseExpression()
		lexRow = this.getSymb()
		if (lexRow.token === 'rel_op'){
			this.addRow()
			this.parseExpression()
			// this.setPostfixCode(lexRow)
		}
		else {
			throw 'mismatch in BoolExpr'
		}
		return true
	}

	getPostfixCode () {
		return this.postfixCode
	}

	logger(statement){
		// let lexRow = this.getSymb(this.row)
		let tabs = ''
		
		for (let i = 0; i < this.level; i++){
			tabs += '\t'
		}

		// console.log(`${tabs}В рядку ${lexRow.row} знайдено ${lexRow.lexeme} - ${lexRow.token}`)
		if (this.isViewPOLIZSteps) console.log(`${tabs} ${statement}`)
	}
}
