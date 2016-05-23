function SynataticAnalysis(){
	//开始符号
	this.startSymbol = "";
	//文法集
	this.formulas = new Array();
	//终结符集
	this.terSymbols = new Array();
	//非终结符集
	this.noSymbols = new Array();
	//所有符号集
	this.allSymbol = new Array();
	//first集的判断
	this.judgefirst = new Object();
	//first集
	this.firstSet = new Object();
	//右部first集
	this.rightFirst = new Object();
	//follow集判断
	this.judgefollow = new Object();
	//follow集
	this.followSet = new Object();
	//预测分析表
	this.M = new Object();
	//readFormula
	var wfs = document.getElementById("wf").value.split("\n");
	for (var i = 0; i < wfs.length; i++){
		if (0 == i){
			//初始化开始符号
			this.startSymbol = wfs[0].split("->")[0];
		}
		if (wfs[i].indexOf("|") != -1){
			//添加复杂产生式
			this.addFormulas(wfs[i]);
		}else{
			this.formulas.addNewelement(new Formula(wfs[i]));
		}
	}
	this.init();
}


SynataticAnalysis.prototype = {
	//添加复杂产生式
	addFormulas : function(str_fromula){
		var fs = Formula.prototype.splitFormula(str_fromula);
		for (var i = 0; i < fs.length; i++){
			this.formulas.addNewelement(fs[i]);
		}
	},
	//初始化集合
	init : function(){
		//初始化非终结符
		for (var i = 0; i < this.formulas.length; i++){
			this.noSymbols.addNewnosymbol(this.formulas[i].getLeft());
		}
		//初始化终结符
		for (var i = 0; i < this.formulas.length; i++){
			for (var j = 0; j < this.formulas[i].getRigthsize(); j++){
				if (-1 == this.noSymbols.indexOf(this.formulas[i].getRightIndex(j))){
					this.terSymbols.addNewtersymbol(this.formulas[i].getRightIndex(j));
				}
			}
		}
		//将结束标记放入终结符
		this.terSymbols.addNewtersymbol("#");
		//初始化所有符号集
		for (var i = 0; i < this.terSymbols.length; i++){
			this.allSymbol.push(this.terSymbols[i]);
		}
		for (var i = 0; i < this.noSymbols.length; i++){
			this.allSymbol.push(this.noSymbols[i]);
		}
		//初始化FIRST集和FOLLOW集(仅初始化集合的key:符号)
		for (var i = 0; i < this.allSymbol.length; i++){
			var key = this.allSymbol[i];
			this.firstSet[key] = undefined;
			this.judgefirst[key] = false;
			if (this.noSymbols.indexOf(key) != -1){
				this.followSet[key] = undefined;
				this.judgefollow[key] = false;
			}
		}
		//初始化每个符号的FIRST集
		for (var i = 0; i < this.allSymbol.length; i++){
			var key = this.allSymbol[i];
			if (!this.judgefirst[key]){
				//加入FIRST集
				this.firstSet.addNewSet(key,this.getFirst(key));
			}
		}
		//初始化每个非终结符号的follow集
		for (var i = 0; i < this.noSymbols.length; i++){
			var sym = this.noSymbols[i];
			if(!this.judgefollow[sym]){
				this.followSet[sym] = this.getFollow(sym);
				this.judgefollow[sym] = true;
			}
		}
		//初始化每个formula的follow集
		for (var i = 0; i < this.formulas.length; i++){
			var f = this.formulas[i];
			this.rightFirst[f] = this.getFormulaFirst(f);
		}
		//初始化预测分析表
		this.initM();
	},
	//获取first集
	getFirst : function(key){
		var first = new Array();
		var temphash = new Array();
		if (this.terSymbols.indexOf(key) != -1){
			first.addNewtersymbol(key);
			return first;
		}
		for (var i = 0; i < this.formulas.length; i++){
			var key_formula = this.formulas[i];
			if (0 == key_formula.getLeft().localeCompare(key)){
				if (-1 != this.terSymbols.indexOf(key_formula.getRightIndex(0))){
					//如果公式右侧第一个字符是终结符，就把这个终结符加到FIRST集中
					first.addNewtersymbol(key_formula.getRightIndex(0));
					continue;
				}
				if (0 == key_formula.getRight().localeCompare("@")){
					//如果公式右侧为@空，则把右侧@加入FIRST集中
					first.addNewtersymbol("@");
					continue;
				}
				var index = 1; //用来判断是不是所有公式都包含@空的情况
				for (var j = 0; j < key_formula.getRigthsize(); j++){
					var temps = key_formula.getRightIndex(j);
					if (!this.judgefirst[temps]){
						this.firstSet[temps] = this.getFirst(temps);
						this.judgefirst[temps] = true;
					}
					for (var m = 0; m < this.firstSet[temps].length; m++){
						temphash.push(this.firstSet[temps][m]);
					}
					var indexofkong = temphash.indexOf("@");
					while(indexofkong != -1){
						temphash.splice(indexofkong,1);
						indexofkong = temphash.indexOf("@");
					}
					for (var m = 0; m < temphash.length; m++){
						first.push(temphash[m]);
					}
					if (-1 != this.firstSet[temps].indexOf("@")){
						index++;
					}else{
						break;
					}
				}
				if (index === this.formulas[i].getRigthsize()){
					//alert(key_formula.getLeft() + ":" + first);
					first.push("@");
				}
				
			}
		}
		return first;
	},
	getFollow : function(key){
		//定义用来返回的follow集
		var follow = new Array();
		var temphash = new Array();
		//把空字符#放入开始符号的FOLLOW集中
		if (0 == this.startSymbol.localeCompare(key)){
			follow.addNewtersymbol("#");
		}
		var right,temps;
		//遍历所有文法
		for (var i = 0; i < this.formulas.length; i++){
			var f_formula = this.formulas[i];
			//获得右部
			right = f_formula.getRight();
			//判断右部是否包含key
			if (-1 != right.indexOf(key)){
				for (var j = 0; j < f_formula.getRigthsize(); j++){
					temps = f_formula.getRightIndex(j);
					if (0 == temps.localeCompare(key)){
						if (j == f_formula.getRigthsize() - 1){
							if (0 == f_formula.getLeft().localeCompare(key)){
								break;
							}
							if (!this.judgefollow[f_formula.getLeft()]){
								this.followSet[f_formula.getLeft()] = this.getFollow(f_formula.getLeft());
								this.judgefollow[f_formula.getLeft()] = true;
							}
							//addall
							for (var m = 0; m < this.followSet[f_formula.getLeft()].length; m++){
//								follow[m] = this.followSet[f_formula.getLeft()][m];
								follow.addNewtersymbol(this.followSet[f_formula.getLeft()][m]);
							}
						}
						else{
							var tmp_firstset = this.firstSet[f_formula.getRightIndex(f_formula.getRigthsize() - 1)];
							if ((j == f_formula.getRigthsize() - 2) && (-1 != tmp_firstset.indexOf("@"))){
								if (0 == f_formula.getLeft().localeCompare(key)) break;
								if (!this.judgefollow[f_formula.getLeft()]){
									this.followSet[f_formula.getLeft()] = this.getFollow(f_formula.getLeft());
									this.judgefollow[f_formula.getLeft()] = true;
								}
								//addall
								for (var m = 0; m < this.followSet[f_formula.getLeft()].length; m++){
//									follow[m] = this.followSet[f_formula.getLeft()][m];
									follow.addNewtersymbol(this.followSet[f_formula.getLeft()][m]);
								}
							}
							if (-1 != this.terSymbols.indexOf(f_formula.getRightIndex(j + 1))){
								follow.addNewtersymbol(f_formula.getRightIndex(j + 1));
							}
							else{
								var first_temp = this.firstSet[f_formula.getRightIndex(j + 1)];
								//addall
								for (var m = 0; m < first_temp.length; m++){
//									temphash[m] = first_temp[m];
									temphash.addNewtersymbol(first_temp[m]);
								}
								var indexoftemp = temphash.indexOf("@");
								while (-1 != indexoftemp){
									temphash.splice(indexoftemp,1);
									indexoftemp = temphash.indexOf("@");
								}
								//addall
								for (var m = 0; m < temphash.length; m++){
//									follow[m] = temphash[m];
									follow.addNewtersymbol(temphash[m]);
								}
							}
						}
					}
				}
			}
		}
		return follow;
	},
	//获取一个firmula的first集
	getFormulaFirst : function(formula){
		//定义用来返回的FIRST集
		var firsts = new Array();
		var temp = new Array();
		var bool = false;
		var flag = 0;
		if (0 == formula.getRight().localeCompare("@")){
			firsts.addNewtersymbol("@");
			return firsts;
		}
		for (var i = 0; i < formula.getRigthsize(); i++){
			var firstSet_temp = this.firstSet[formula.getRightIndex(i)];
			for (var m = 0; m < firstSet_temp.length; m++){
				temp.addNewtersymbol(firstSet_temp[m]);
			}
			var indexOftemp = temp.indexOf("@");
			while (-1 != indexOftemp){
				bool = true;
				temp.splice(indexOftemp,1);
				indexOftemp = temp.indexOf("@");
			}
			for (var m = 0; m < temp.length; m++){
				firsts.addNewtersymbol(temp[m]);
			}
			flag++;
			if (!bool){
				break;
			}
		}
		if (flag == formula.getRigthsize() && flag > 1){
			firsts.addNewtersymbol("@");
		}
		return firsts;
	},
	//生成预测分析表
	initM : function(){
		var key;
		for (var i = 0; i < this.formulas.length; i++){
			var f_formula = this.formulas[i];
			for (var j = 0; j < this.terSymbols.length; j++){
				var terSym = this.terSymbols[j];
				if (0 == terSym.localeCompare("@")) continue;
				key = f_formula.getLeft() + terSym;
				if (-1 != this.rightFirst[f_formula].indexOf(terSym)){
					this.M[key] = f_formula;
				}
			}
			if (-1 != this.rightFirst[f_formula].indexOf("@")){
				for (var k = 0; k < this.terSymbols.length; k++){
					var ter = this.terSymbols[k];
					if (0 == ter.localeCompare("@")) continue;
					key = f_formula.getLeft() + ter;
					if (-1 != this.followSet[f_formula.getLeft()].indexOf(ter)){
						this.M[key] = f_formula;
					}
				}
			}
		}
	},
	//开始分析
	startAnalyse : function(source){
		var stack = new Array();
		var keys = new Array();
		for (key in this.M){
			if (key == "addNewSet") continue;
			keys.push(key);
		}
		var X, a, index = 0;
		stack.push("#");
		stack.push(this.startSymbol);
		a = source.substring(index,index + 1);
		var flag = true;
		var exit = false;
		var f;
		while (flag == true){
			X = stack.pop();
			if (-1 != this.terSymbols.indexOf(X)){
				if (0 == X.localeCompare(a)){
					index++;
					if (index == source.length) break;
					a = source.substring(index,index + 1);
				}
				else{
					return false;
				}
			}
			else if (0 == X.localeCompare("#")){
				if (0 == X.localeCompare(a)){
					flag = false;
				}
				else{
					return false;
				}
			}
			else{
				for (var i = 0; i < keys.length; i++){
					var key = keys[i];
					if (-1 != key.indexOf(a) && 0 == this.M[key].getLeft().localeCompare(X)){
						f = this.M[key];
						exit = true;
					}
				}
				if (exit == true){
					if(0 == f.getRight().localeCompare("@")){
						continue;
					}
					for (var j = f.getRigthsize() - 1; j >= 0; j--){
						stack.push(f.getRightIndex(j));
					}
				}
				else{
					return false;
				}
			}
		}
		alert("success!")
		return true;
	}
}

document.getElementById("ok").onclick = buttonClick; 

function buttonClick(){
	showResult();

}

Array.prototype.addNewelement = function(element){
	for (var i = 0; i < this.length; i++){
		if (this[i].formula == element.formula){
			return false;
		}
	}
	this.push(element);
	return true;
}
Array.prototype.addNewtersymbol = function(element){
	for (var i = 0; i < this.length; i++){
		if (this[i] == element){
			return false;
		}
	}
	this.push(element);
	return true;
}

Array.prototype.addNewnosymbol = function(element){
	for (var i = 0; i < this.length; i++){
		if (this[i] == element){
			return false;
		}
	}
	this.push(element);
	return true;
}

Object.prototype.addNewSet = function(key,value){

	this[key] = value;
}

//输出结果
function showResult(){
	var rootNode = document.getElementById("rootoutput");
	if (rootNode != null){
		document.body.removeChild(rootNode);
	}
	var syn = new SynataticAnalysis();
	if (document.getElementById("rootoutput")){
		return false;
	}
	var root_output = document.createElement("div");
	root_output.setAttribute("id","rootoutput");
	var all_formula = document.createElement("h4");
	var all_formula_text = document.createTextNode("所有文法：");
	all_formula.appendChild(all_formula_text);
	all_formula.setAttribute("class","outputtext");
	root_output.appendChild(all_formula);
	for (var i = 0; i < syn.formulas.length; i++){
		var formula_element = document.createElement("p");
		formula_element.setAttribute("class","outputtext");
		var formula_element_text = document.createTextNode(syn.formulas[i]);
		formula_element.appendChild(formula_element_text);
		root_output.appendChild(formula_element);
	}
	//输出终结符
	var terSymbol = document.createElement("h4");
	var terSymbol_text = document.createTextNode("终结符：");
	terSymbol.appendChild(terSymbol_text);
	terSymbol.setAttribute("class","outputtext");
	root_output.appendChild(terSymbol);
	var terSymbol_text = "";
	for (var i = 0; i < syn.terSymbols.length; i++){
		terSymbol_text += syn.terSymbols[i];
		terSymbol_text += "     ";
	}
	var terSymbol_element = document.createElement("p");
	var terSymbol_element_text = document.createTextNode(terSymbol_text);
	terSymbol_element.appendChild(terSymbol_element_text);
	root_output.appendChild(terSymbol_element);
	//输出非终结符（变量没做改变）
	var terSymbol = document.createElement("h4");
	var terSymbol_text = document.createTextNode("非终结符：");
	terSymbol.appendChild(terSymbol_text);
	terSymbol.setAttribute("class","outputtext");
	root_output.appendChild(terSymbol);
	var terSymbol_text = "";
	for (var i = 0; i < syn.noSymbols.length; i++){
		terSymbol_text += syn.noSymbols[i];
		terSymbol_text += "     ";
	}
	var terSymbol_element = document.createElement("p");
	var terSymbol_element_text = document.createTextNode(terSymbol_text);
	terSymbol_element.appendChild(terSymbol_element_text);
	root_output.appendChild(terSymbol_element);
	//输出所有符号
	var terSymbol = document.createElement("h4");
	var terSymbol_text = document.createTextNode("所有符号：");
	terSymbol.appendChild(terSymbol_text);
	terSymbol.setAttribute("class","outputtext");
	root_output.appendChild(terSymbol);
	var terSymbol_text = "";
	for (var i = 0; i < syn.allSymbol.length; i++){
		terSymbol_text += syn.allSymbol[i];
		terSymbol_text += "     ";
	}
	var terSymbol_element = document.createElement("p");
	var terSymbol_element_text = document.createTextNode(terSymbol_text);
	terSymbol_element.appendChild(terSymbol_element_text);
	root_output.appendChild(terSymbol_element);
	
	//输出First集
	var firstset = document.createElement("h4");
	var firstset_text = document.createTextNode("first集：");
	firstset.setAttribute("class","outputtext");
	firstset.appendChild(firstset_text);
	root_output.appendChild(firstset);
	for (key in syn.firstSet){
		if (key == "addNewSet") continue;
		var firstset_element = document.createElement("p");
		firstset_element.setAttribute("class","outputtext");
		var firstset_element_text = document.createTextNode("\"" + key + "\"" + "的first集为:" + syn.firstSet[key]);
		firstset_element.appendChild(firstset_element_text);
		root_output.appendChild(firstset_element);
	}
	//输出follow集
	var followset = document.createElement("h4");
	var followset_text = document.createTextNode("follow集：");
	followset.setAttribute("class","outputtext");
	followset.appendChild(followset_text);
	root_output.appendChild(followset);
	for (key in syn.followSet){
		if (key == "addNewSet") continue;
		var followset_element = document.createElement("p");
		followset_element.setAttribute("class","outputtext");
		var followset_element_text = document.createTextNode("\"" + key + "\"" + "的follow集为:" + syn.followSet[key]);
		followset_element.appendChild(followset_element_text);
		root_output.appendChild(followset_element);
	}
	//输出文法的first集
	var formulaset = document.createElement("h4");
	var formulaset_text = document.createTextNode("formulaFirstSet: ");
	formulaset.setAttribute("class","outputtext");
	formulaset.appendChild(formulaset_text);
	root_output.appendChild(formulaset);
	for (key in syn.rightFirst){
		if (key == "addNewSet") continue;
		var formulaset_element = document.createElement("p");
		formulaset_element.setAttribute("class","outputtext");
		var formulaset_element_text = document.createTextNode("\"" + key + "\"的first集为:" + syn.rightFirst[key]);
		formulaset_element.appendChild(formulaset_element_text);
		root_output.appendChild(formulaset_element)
	}
	//输出预测分析表
	var formulaset = document.createElement("h4");
	var formulaset_text = document.createTextNode("预测分析表: ");
	formulaset.setAttribute("class","outputtext");
	formulaset.appendChild(formulaset_text);
	root_output.appendChild(formulaset);
	for (key in syn.M){
		if (key == "addNewSet") continue;
		var formulaset_element = document.createElement("p");
		formulaset_element.setAttribute("class","outputtext");
		var formulaset_element_text = document.createTextNode("\"" + key + "\":" + syn.M[key]);
		formulaset_element.appendChild(formulaset_element_text);
		root_output.appendChild(formulaset_element)
	}
	document.body.appendChild(root_output);
	var juzi = document.getElementById("juzi").value;
	if (0 != juzi[juzi.length - 1].localeCompare("#")){
		juzi += "#";
	}
	if (!syn.startAnalyse(juzi)){
		alert("语法错误!");
	}
}
