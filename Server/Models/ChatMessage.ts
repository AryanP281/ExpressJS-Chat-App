
/**************************Class*********************** */

class ChatMessage
{
    public index : number;
    public username : string;
    public message : string;
    public timestamp : string;

    constructor(index : number, username : string, msg : string, timestamp : string)
    {
        this.index = index;
        this.username = username;
        this.message = msg;
        this.timestamp = timestamp;
    }

    public getJsonObject() : {index : number,message : string, username : string}
    {
        const msg : string = this.message;
        const unm : string = this.username;
        const id : number = this.index;

        return {index:id,message:msg,username:unm};
    }

    public getDbObject() : {index : number, username : string, message : string, timestamp : string}
    {
        const idx : number = this.index;
        const msg : string = this.message;
        const unm : string = this.username;
        const stmp : string = this.timestamp;

        return {index:idx, username:unm, message:msg, timestamp:stmp};
    }
};

/**********************Exports*****************/
export default ChatMessage;