
class indexdDBManiger{
    // Database info
    dbVer=1;
    _length=-1;
    constructor(dbName,STORE){
        this.dbName=dbName;
        this.STORE=STORE;
    }

    async asyncLength(){
        this._length=this.getStoreTransaction("readonly",(table)=>this.requestToPromise(table.count()));
        return this._length;
    };
    // NOTE:
    // get the last lenght used "instently" rather than having to awatit 
    // but it will often be out of date if it is not constently maintained.
    get fastLength(){
        if(this._length<-1){
            console.error("the requestid length was never preloaded");
        }
        return this._length;
    }
    isEmpty(obj,key){
        return obj[key]===null||obj[key]==="";
    }
    isValid(objA,objB,key){
        try{
            objA[key];
            objB[key];
        }catch(e){
            return false;
        }
        return true;
    }
    async getString(){
        const entrys=await this.getAllEntrys();
        let out="___getString___\n";
        for(let en of entrys){
            for(const [key,value] of Object.entries(en)){
                out+=key+":"+value+","
            }
            out+="\n";
        }
        return out;
    }

    requestToPromise(request){
        // this takes in a db.transaction(this.STORE,mode).objectStore(this.STORE);
        // and returns it as a promise with a fail safe condition
        return new Promise((resolve,reject)=>{
            request.onsuccess=()=>{resolve(request.result);}
            request.onerror=()=>{reject(request.error);}
        })
    }

    openDB(){
        return new Promise((resolve,reject)=>{
            const request=indexedDB.open(this.dbName,this.dbVer);
            request.onupgradeneeded=()=>{
                // this is refrencing onsucses
                const db=request.result;
                // if the data base exist move on, if not establish it
                if(!db.objectStoreNames.contains(this.STORE)){
                    // instancheat a column named id with an incermented value asined to each row
                    const table=db.createObjectStore(this.STORE,{keyPath:"id",autoIncrement:true});
                    // create additional filters
                    // table.createIndex("","",{unique:false});
                }
            };
            // I dont achaly understand request.result and it bugs me
            request.onsuccess=()=>{resolve(request.result);};
            request.onerror=()=>{reject(request.error);};
        });
    }
    async getStoreTransaction(mode,fn){
        const db=await this.openDB();
        return new Promise((resolve,reject)=>{
            // select the table and the mode of access
            const tx=db.transaction(this.STORE,mode);
            // access the table
            const table=tx.objectStore(this.STORE);
            
            // test the pased func fn; this expects ~requestToPromise(table.add(obj))
            let result;
            try{
                result=fn(table);
            }catch(err){
                console.log(fn);
                reject(err);
                return;
            }

            tx.oncomplete=()=>{ db.close(); resolve(result); };

            tx.onerror=()=>{ db.close(); reject(tx.error); };
            tx.onabort=()=>{ db.close(); reject(tx.error); };
        });
    }

    // convert an object to a promis and pass it to a transachion.
    // - I have them in {} is that preventing a return i need?
    async createEntry(obj){
        this._length++;
        return this.getStoreTransaction("readwrite",(table)=>this.requestToPromise(table.add(obj)));

    }
    async deleteEntry(id){
        this._length--;
        return this.getStoreTransaction("readwrite",(table)=>this.requestToPromise(table.delete(id)));
    }
    async deleteAllEntrys(id){
        this._length=0;
        return this.getStoreTransaction("readwrite",(table)=>this.requestToPromise(table.clear()));
    }
    async getEntry(id){
        return this.getStoreTransaction("readonly",(table)=>this.requestToPromise(table.get(id)));
    }
    async getAllEntrys(){
        return this.getStoreTransaction("readonly",(table)=>this.requestToPromise(table.getAll()));
    }
    async updateEntry(id, obj){
        const existing=await this.getEntry(id);
        if(!existing){ throw new Error('Cant find record'); }
        // AI sugesgion
        // iterate each key in the object
        const update=Object.fromEntries(
            // converts the object to a map for some reson?
            Object.keys({...existing,...obj}).map(key=>[
                // runs a test to deturmon if the key feild of the new object 
                // is valid and not empty befor returning the value
                key,this.isValid(existing,obj,key)&& !this.isEmpty(obj,key)?obj[key]:existing[key]
            ]));
        // Ai: I just didint have this in my notes, thay were realy bad this day
        return this.getStoreTransaction("readonly",(table)=>this.requestToPromise(table.put({id,...update})));
    }
}