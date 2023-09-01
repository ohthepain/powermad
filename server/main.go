package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"moul.io/banner"
)

var ctx gin.Context
var client mongo.Client
var powermadDb *mongo.Database
var sequencesCollection *mongo.Collection
var midichartsCollection *mongo.Collection

func CORS(c *gin.Context) {

	// TODO: CORS is wide open!
	// First, we add the headers with need to enable CORS
	// Make sure to adjust these headers to your needs
	c.Header("Access-Control-Allow-Origin", "*")
	c.Header("Access-Control-Allow-Methods", "*")
	c.Header("Access-Control-Allow-Headers", "*")
	c.Header("Content-Type", "application/json")

	// Second, we handle the OPTIONS problem
	if c.Request.Method != "OPTIONS" {

		c.Next()

	} else {

		// Everytime we receive an OPTIONS request,
		// we just return an HTTP 200 Status Code
		// Like this, Angular can now do the real
		// request using any other method than OPTIONS
		c.AbortWithStatus(http.StatusOK)
	}
}

func main() {
	fmt.Printf("%s\n\t\t\t... welcomes you!\n\n", banner.Inline("powermad server"))

	client, err := mongo.NewClient(options.Client().ApplyURI("mongodb+srv://paul:kEhref-bivqyn-8gewse@cluster0.b585l.mongodb.net/"))
	if err != nil {
		log.Fatal(err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	err = client.Connect(ctx)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("connection successful")

	// err = client.Ping(ctx, readpref.Primary())
	// if err != nil {
	// 	log.Fatal(err)
	// }

	// Disconnect on exit? or when this method completes?
	defer client.Disconnect(ctx)

	powermadDb = client.Database("Powermad")
	sequencesCollection = powermadDb.Collection("sequences")
	midichartsCollection = powermadDb.Collection("midicharts")

	router := gin.Default()
	router.Use(CORS)
	router.GET("/midicharts", getMidiCharts)
	router.GET("/genres", getGenres)
	router.GET("/sequences", getSequences)
	router.GET("/sequence/:id", getSequence)
	router.POST("/sequence", postSequence)
	router.PUT("/sequence", putSequence)
	router.PUT("/midichart", putMidiChart)
	router.DELETE("/sequence/:id", deleteSequence)

	router.Run("0.0.0.0:8080")
}

func deleteSequence(ctx *gin.Context) {
	id := ctx.Params.ByName("id")
	fmt.Printf("deleteSequence %s\n", id)

	// opts := options.Delete().SetHint(bson.D{{Key: "_id", Value: id}})
	_id, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		log.Fatal(err)
	}

	filter := bson.D{{Key: "_id", Value: _id}}
	if _, err := sequencesCollection.DeleteOne(ctx, filter); err != nil {
		log.Fatal(err)
	}

	ctx.JSON(http.StatusOK, bson.D{})
}

func getSequence(ctx *gin.Context) {
	id := ctx.Params.ByName("id")
	fmt.Printf("%s\n", id)

	_id, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		log.Fatal(err)
	}

	var sequence bson.M
	if err := sequencesCollection.FindOne(ctx, bson.M{"_id": _id}).Decode(&sequence); err != nil {
		log.Fatal(err)
	}

	ctx.JSON(http.StatusOK, sequence)
}

func postSequence(c *gin.Context) {
	jsonData, err := io.ReadAll(c.Request.Body)

	var document bson.M = bson.M{}
	err = json.Unmarshal(jsonData, &document)
	if err != nil {
		log.Fatal(err)
	}

	result, err := sequencesCollection.InsertOne(c, document)
	if err != nil {
		log.Fatal(err)
	}

	c.JSON(http.StatusOK, result.InsertedID)
}

type HexId struct {
	ID primitive.ObjectID `bson:"_id"`
}

func putMidiChart(c *gin.Context) {
	jsonData, err := io.ReadAll(c.Request.Body)

	var document bson.M
	err = bson.UnmarshalExtJSON(jsonData, true, &document)
	if err != nil {
		log.Fatal(err)
	}

	// fix _id
	var hexId HexId
	err = bson.UnmarshalExtJSON(jsonData, true, &hexId)
	_id, err := primitive.ObjectIDFromHex(hexId.ID.Hex())
	if err != nil {
		log.Fatal(err)
	}
	document["_id"] = hexId.ID

	result, err := midichartsCollection.ReplaceOne(c, bson.M{"_id": _id}, document)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Printf("Modified %d document(s)\n", result.ModifiedCount)
	c.JSON(http.StatusOK, result.UpsertedCount)
}

func putSequence(c *gin.Context) {
	jsonData, err := io.ReadAll(c.Request.Body)

	var document bson.M
	err = bson.UnmarshalExtJSON(jsonData, true, &document)
	if err != nil {
		log.Fatal(err)
	}

	// fix _id
	var hexId HexId
	err = bson.UnmarshalExtJSON(jsonData, true, &hexId)
	_id, err := primitive.ObjectIDFromHex(hexId.ID.Hex())
	if err != nil {
		log.Fatal(err)
	}
	document["_id"] = hexId.ID

	result, err := sequencesCollection.ReplaceOne(c, bson.M{"_id": _id}, document)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Printf("Modified %d document(s)\n", result.ModifiedCount)
	c.JSON(http.StatusOK, result.UpsertedCount)
}

func getMidiCharts(ctx *gin.Context) {
	condition := bson.D{}

	findOptions := options.Find()
	cursor, err := powermadDb.Collection("midicharts").Find(ctx, condition, findOptions)
	if err != nil {
		log.Fatal(err)
	}

	defer cursor.Close(ctx)

	// var responseContent bson.M = bson.M{}
	numMidiCharts := cursor.RemainingBatchLength()
	responseContent := make([]bson.M, 0, numMidiCharts)
	for cursor.Next(ctx) {
		var midichart bson.M
		if err = cursor.Decode(&midichart); err != nil {
			log.Fatal(err)
		}
		responseContent = append(responseContent, midichart)
		fmt.Printf("\tmidichart: %s manufacturer=%s\n", midichart["familyName"], midichart["manufacturer"])
	}

	ctx.IndentedJSON(http.StatusOK, responseContent)
}

func getSequences(ctx *gin.Context) {
	var queryFilter bson.M = bson.M{}
	var err error
	queryFilter["page"] = ctx.Query("page")
	log.Printf("%s", queryFilter)
	sequencesPerPage, err := strconv.Atoi(ctx.DefaultQuery("sequencesPerPage", "20"))
	page, err := strconv.Atoi(ctx.DefaultQuery("page", "0"))

	var tempoFilter bson.M = bson.M{}
	tempoFilter["$gte"], err = strconv.Atoi(ctx.DefaultQuery("tempoMin", "0"))
	tempoFilter["$lte"], err = strconv.Atoi(ctx.DefaultQuery("tempoMax", "1000"))
	condition := bson.D{{Key: "tempo", Value: tempoFilter}}

	findOptions := options.Find()
	findOptions.SetSort(bson.D{{Key: "tempo", Value: 1}})
	findOptions.SetLimit(int64(sequencesPerPage))
	findOptions.SetSkip(int64(page * sequencesPerPage))
	cursor, err := powermadDb.Collection("sequences").Find(ctx, condition, findOptions)
	if err != nil {
		log.Fatal(err)
	}

	defer cursor.Close(ctx)
	numSequences := cursor.RemainingBatchLength()
	sequences := make([]bson.M, 0, numSequences)
	for cursor.Next(ctx) {
		var sequence bson.M
		if err = cursor.Decode(&sequence); err != nil {
			log.Fatal(err)
		}
		sequences = append(sequences, sequence)
		fmt.Printf("\tsequence: %s tempo=%d\n", sequence["name"], sequence["tempo"])
	}

	var responseContent bson.M = bson.M{}
	responseContent["page"] = page
	responseContent["filters"] = condition
	responseContent["entries_per_page"] = sequencesPerPage
	responseContent["total_results"] = numSequences
	responseContent["sequences"] = sequences

	ctx.IndentedJSON(http.StatusOK, responseContent)
}

func getGenres(ctx *gin.Context) {
	findOptions := options.Find()
	genres, err := powermadDb.Collection("sequences").Distinct(ctx, "genre", findOptions)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Printf("genres: %s\n", genres...)

	// genres := make([]string, 0, genres...)

	// defer cursor.Close(ctx)
	// numSequences := cursor.RemainingBatchLength()
	// sequences := make([]bson.M, 0, numSequences)
	// for cursor.Next(ctx) {
	// 	var sequence bson.M
	// 	if err = cursor.Decode(&sequence); err != nil {
	// 		log.Fatal(err)
	// 	}
	// 	sequences = append(sequences, sequence)
	// 	fmt.Printf("\tsequence: %s tempo=%d\n", sequence["name"], sequence["tempo"])
	// }

	var responseContent bson.M = bson.M{}
	responseContent["genres"] = genres

	ctx.IndentedJSON(http.StatusOK, responseContent)
}
