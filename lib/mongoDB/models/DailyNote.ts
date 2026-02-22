
import { model, models, Schema } from "mongoose";


const DailyNoteSchema = new Schema({
    dateKey : {type:String,required: true,unique:true},
    title:{type:String, default:""},
    content :{type: String ,default:""},

},
{
    timestamps:true
});

export const DailyNote = models.DailyNote || model("DailyNote", DailyNoteSchema);