// import http from "../http-common"
import axios from "axios"

class SequenceDataService {

    // getAll(page = 0, tempoMin = 0, tempoMax= 1000) {
    //     console.log(`SequenceDataService.getAll page ${page} tempo range ${tempoMin}/${tempoMax}`)
    //     const url = `sequences?page=${page}&tempoMin=${tempoMin}&tempoMax=${tempoMax}`
    //     console.log(`URL: ${url}`)
    //     return http.get(url);
    // }

    get(id: any) {
        console.log(`SequenceDataService.get ${id}`)
        // return http.get(`sequence?_id=${id}`);
        return axios.get(`http://localhost:8080/sequence/${id}`)
    }

    // find(query: any, by = "name", page = 0) {
    //     console.log(`SequenceDataService.find by ${by} = ${query} page ${page}`)
    //     // eslint-disable-next-line no-template-curly-in-string
    //     return http.get("sequences/?{by}=${query}&page=${page}");
    // }

    // createSequence(data: any) {
    //     // console.log(`SequenceDataService.createSequence ${JSON.stringify(data)}`);
    //     return http.post(`sequence`, data);
    // }

    saveSequence(sequence: any) {
        // console.log(`SequenceDataService.saveSequence: ${JSON.stringify(sequence)}`)
        // return http.put(`sequence`, sequence);
        return axios.put(`http://localhost:8080/sequence`, sequence)
    }

    deleteSequence(sequence: any) {
        console.log(`SequenceDataService.deleteSequence: ${JSON.stringify(sequence)}`);
        // return http.delete(`/sequence?id=${sequence._id}`)
        return axios.delete(`http://localhost:8080/sequence/${sequence._id}`)
    }

    // createGenre(data: any) {
    //     return http.post(`genre`, data);
    // }

    // updateGenre(data: any) {
    //     return http.put(`genre`, data);
    // }

    // deleteGenre(id: any) {
    //     return http.delete(`/genre?id=${id}`)
    // }

    // Untested - I doubt this works on the server side
    getGenres() {
        // return http.get("/genres")
        return axios.get("http://localhost:8080/genres")
    }

    // updateReview(data: any) {
    //     return http.put(`review`, data);
    // }
}

export default new SequenceDataService();
