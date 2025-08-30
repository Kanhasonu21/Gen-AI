import { chatModel } from "../shared/connections.js"

const chatModelTest = async()=>{
    const resullt = await chatModel.invoke("Write about Tom Cruise.")
    console.log(resullt)
}
export default chatModelTest