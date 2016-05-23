function Formula(agr_string){	
	//存放公式的字符串
	this.formula = agr_string;
	if (!this.judgement()){
		return false;
	}
}

Formula.prototype = {
	judgement : function(){
		//判断文法中是不是含有"->"，若没有则报错
		if (-1 == this.formula.indexOf("->")){
			alert("错误：文法\"" + this.formula + "\"中不包含\"->\"");
			return false;
		}else{
			//如果"->"前或后存在空，报错
			if (0 == this.formula.split("->")[0].length || 0 == this.formula.split("->")[1].length){
				alert("错误：文法\"" + this.formula + "\"中不\"->\"前或后为空");
				return false;
			}
			//存在多个->时报错
			if (this.formula.split("->").length > 2){
				alert("错误：文法\"" + this.formula + "\"中存在大于一个的\"->\"")
				return false;
			}
		}
		return true;
	},
	//分离候选项
	splitFormula : function(formula_str){
		var formulas = new Array();
		var fma = new Formula(formula_str);
		var strs = fma.getRight().split("|");
		//alert(strs.length);
		for (var i = 0; i < strs.length; i++){
			var newfam = fma.getLeft() + "->" + strs[i];
			formulas.push(new Formula(newfam));
		}
		return formulas;
	},
	//获取左部
	getLeft : function(){
		return this.formula.split("->")[0];
	},
	//获取右部
	getRight : function(){
		return this.formula.split("->")[1];
	},
	//重写toString
	toString : function(){
		return this.formula;
	},
	//获取右部的候选词数量
	getRigthsize : function(){
		return this.getRight().split(" ").length;
	},
	//通过索引检索右部
	getRightIndex : function(index){
		return this.getRight().split(" ")[index];
	}
}

function fuzhi(){
	document.getElementById("wf").value = "E->T E'\nE'->+ T E'|@\nT->F T'\nT'->* F T'|@\nF->( E )|i";
	document.getElementById("juzi").value = "(i*(i+i))";
}

window.onload = fuzhi;