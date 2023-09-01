import axios from "axios";

export default axios.create({
        baseURL: "https://eu-central-1.aws.data.mongodb-api.com/app/powermad-hsulz/endpoint",
        headers: {
            "Content-type": "application/json"
        }
    }
);
