import axios from 'axios';

const api = axios.create({
    baseURl: import.meta.env.VITE_BASEURL,
})

export default api