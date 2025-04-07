import axios from 'axios';

let apiUrl = process.env.TASK_URL ?? `http://localhost:3000/api/tasks`

const createTask = async (api_url, data): Promise<any[]> => {

    try {


        let resp = await axios.post(api_url ? api_url : apiUrl, data) as any;





        return resp
    } catch (err) {
        console.log(err, 'ERR')
        return []
    }
}

export default createTask