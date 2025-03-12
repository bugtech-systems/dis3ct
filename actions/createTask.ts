import connectToDatabase from '@/lib/mongodb';
import Tasks, { ITask } from '@/models/Task';
import axios from 'axios';

let apiUrl = process.env.TASK_URL || `http://localhost:3000/api/tasks`

console.log(process.env, 'PRRS')
const createTask = async (api_url, data): Promise<any[]> => {

    try {


        let resp = await axios.post(api_url ? api_url : apiUrl, data) as any;





        console.log(resp, 'RESP')
        return resp
    } catch (err) {
        console.log(err, 'ERR')
        return []
    }
}

export default createTask