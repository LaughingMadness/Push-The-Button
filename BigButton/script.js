// * At least two distinct classes.
// * Use of functions, demonstrating modular design and separation of concerns.
// * At least one client-side storage mechanism.
// * The storage solution must be meaningfully integrated into the application.
// * Data must persist across interactions or sessions where appropriate.
// - Superficial use will not receive credit.
// * If using IndexedDB, handl its asynchronous API is required.

// * Interactive user input.
// * Intentional design.
// - All code must include clear, purposeful comments.

/*
BadJoke.com -> a dragand drop site wher you madlib jokes to fill the page.
JumpyGame.com -> a cloued hoper wher the high score is displaed.
QuizSite.com -> an endles searys of random queshgions that you anwer, 
    record and desplay you ansers above.
OneLife.com -> a big red button you can click but has a x% to "kill" you.
NewIdea.com -> a random word generator that hase you drag words
    to an idea line to ether save or discared them.
*/



async function addNewQuote(button,id){
    
    const field=document.getElementById(id);
    button.add(field.value);
    // console.log("add: "+field.value);
    const debugList=await button.QList.getString();
    console.log(debugList);
    field.value="";
}

// this acespts the indexedDB value and standerdises it for my use, inperfict
class Quote{
    constructor(index,quote){
        this.index=index;
        this.quote=quote;
    }
    toString(){
        return `${this.index}:${this.quote}\n`;
    }
}

class BigRedButton{
    lockOut=false;
    // for array use
    // QList=Array.from({length:20},(_,i)=>new Quote(i,"Q"+(i+1)));
    
    // for indedDB use
    rfeList=[];
    QList=new indexdDBManiger("bigButtonList","quotes");

    constructor(idPrint,idFrame="B",idButton="B"){
        this.idFrame=idFrame;
        this.idPrint=idPrint;
        this.idButton=idButton;
    }
    async lodeQIndex(){
        console.log("lodeQIndex");
        
        await this.QList.asyncLength();
        const entrys=await this.QList.getAllEntrys();
        for(let en of entrys){
            this.rfeList.push(en.id);
        }
        console.log(this.rfeList);
        
    }
    async add(quote){
        // for array use
        // const index=this.get(this.QList.length-1).index+1;
        // console.log(this.QList.length-1,this.get(this.QList.length-1).index,index);
        // this.QList.push(new Quote(index,quote));
        
        // for indedDB use
        this.QList.createEntry({quote:quote});
        // this is recording the index of the new entry to a list to avoid having to track
        // or update the idexedDB id field every time i remove an entry
        const index=this.QList.fastLength;
        this.rfeList.push(index);
    }
    async get(index){
        // for array use
        // return this.QList.at(index);

        // for indedDB use
        const QIndex=this.rfeList.at(index);
        // console.log(QIndex);
        
        const entry=await this.QList.getEntry(QIndex);
        // console.log(entry);
        
        console.log(this.rfeList);
        
        return new Quote(index, entry?.quote);
    }
    async remove(index){
        // for array use
        // return this.QList.at(index);

        // for indedDB use
        const QIndex=this.rfeList.at(index);
        this.rfeList.splice(index,1);

        console.log(QIndex);
        
        await this.QList.deleteEntry(QIndex);
        
    }
    // an inturnel funchion used for controling the big red button on click
    async click(){
        if(this.lockOut){ return; }
        this.lockOut=true;
        
        const B=document.getElementById(this.idButton);
        const timeOut=600;

        B.classList.add("press");
               
        // for array use
        // const L=await this.QList.length;

        // for indedDB use            
        const L=await this.QList.asyncLength();

        // Im adding one to intenchanly over shoot creating a 1/L+1 % chance of loosing
        const rng=Math.floor(Math.random()*(L+1));

        if(rng===L){
            console.log("die");
            sessionStorage.setItem("die","die");
            sessionStorage.setItem("Quote",this.lastQ?.index);
            this.QList.deleteAllEntrys();
            console.log(this.lastQ);
            
            if(this.lastQ){
                this.add(this.lastQ.quote);
            }else{
                this.add("Those that do not speeke hold no power.");
            }
        }else{
            this.lastQ=await this.get(rng);
            console.log(this.lastQ);
            
            document.getElementById(this.idPrint).innerText=this.lastQ.quote;
            
            this.remove(rng);
        }

        const isDead=sessionStorage.getItem("die") !== "die";
        // console.log(isDead);
        
        setTimeout(()=>{if(isDead){this.lockOut=false;}}, timeOut*2);
        setTimeout(()=>{if(isDead){B.classList.remove("press");}}, timeOut);
    }

    async html(){
        
        // setup the html desplay befor any prosesing so that it dosn't jiter
        const out=
        `<div class="button_frame">
            <div class="button_cap press" id="${this.idButton}"></div>
            <div class="button_base"></div>
        </div>`;
        document.getElementById(this.idFrame).innerHTML=out;
       
        // for indedDB use
        // instancheat the refrenc list (rfeList) for use 
        try{
            await this.lodeQIndex();
        
            const isDead=sessionStorage.getItem("die") !== "die";
            const B=document.getElementById(this.idButton);
            if(isDead){            
                B.addEventListener("click",()=>this.click());
                B.classList.remove("press");
            }else{
                // const index=Number(sessionStorage.getItem("Quote"));
                // fail safe incase ther are no entrys in the table
                let q="No thats not how this works you only get one life, good by";
                if(this.rfeList.length<1){
                    // I clear the list so that ther is only one entry 
                    q=await this.get(0);
                }
                // console.log(index+"q="+q);
                
                document.getElementById(this.idPrint).innerText=q.quote;
                console.log("start dead");
            }
        }catch(e){
                document.getElementById(this.idPrint).innerText=e;
        }
    }
}