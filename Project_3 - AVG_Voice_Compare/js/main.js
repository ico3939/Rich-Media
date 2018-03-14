"use strict";

// Giant Bomb Api properties
var GIANT_BOMB_CHARACTERS_URL = "https://www.giantbomb.com/api/characters/";
var GIANT_BOMB_SINGLE_CHARACTER_URL = "https://www.giantbomb.com/api/character/";
var GIANT_BOMB_PEOPLE_URL = "https://www.giantbomb.com/api/people/";
var GIANT_BOMB_PERSON_URL = "https://www.giantbomb.com/api/person/";
var GIANT_BOMB_API_KEY = "?api_key=efb55c1786fd8d425f315b00fa4ec3a94120f228&format=jsonp";

//Anilist API urls
var ANILIST_API_URL = "https://graphql.anilist.co";

// properties of the searched character
var characterName;
var characterImage;

// properties of the searched character's voice
var voices = [];
var voiceName;
var voiceImage;
var voiceNum = 0;

// an array containing objects representing 
var otherRoles = [];
var otherRoleCount = 0;

var searchType;
var searchTypes = ({
    ANIME: 0,
    VIDEO_GAME: 1
})

var gbPeopleChecked = 0;
var gbPeopleToCheck = 0;

window.onload = init;
	


function init(){
    document.getElementById("VgCharacterForm").onreset = getGameData;
    document.getElementById("AnimeCharacterForm").onreset = getAnimeData;
}



// resets the form and transitions to the next one
function resetForm(){
    if(document.querySelector('input[name="choose"]:checked') == "null"){return;}
    if(document.querySelector('input[name="choose"]:checked').value == "anime") {
        searchType = searchTypes.ANIME;
    }
    else {
        searchType = searchTypes.VIDEO_GAME;
    }

    document.getElementById("characterForm").reset();
    
    // scroll right
    if(searchType == searchTypes.VIDEO_GAME){
            
        $("#FormsContainer").css({overflow:"visible"}).animate({ 
            right: "100%",
        }, 1000 );
    }
    //scroll left
    else {
        $("#FormsContainer").css({overflow:"visible"}).animate({ 
            left: "100%",
        }, 1000 );
    }

}

function shiftUp() {
    $("#titleDiv").animate({
       bottom: "130px"
    }, 1000);
    $("#FormsContainer").animate({
       bottom: "200px"
    }, 1000);
    $("#result").animate({
       bottom: "200px"
    }, 1000);
    
}



function resetVGForm(){
    voices = [];
    voiceNum = 0;
    otherRoleCount = 0;
    gbPeopleChecked = 0;
    gbPeopleToCheck = 0;
    document.getElementById("VgCharacterForm").reset();
    
}

function resetAnimeForm(){
    voices = [];
    voiceNum = 0;
    otherRoleCount = 0;
    gbPeopleChecked = 0;
    gbPeopleToCheck = 0;
    document.getElementById("AnimeCharacterForm").reset();
    
}



// get data on video game character
function getGameData(){
    
    // concatenate the full urls
    var gbCharsURL = GIANT_BOMB_CHARACTERS_URL;
    gbCharsURL += GIANT_BOMB_API_KEY;
    
    
    // add character text box data
    characterName = document.querySelector("#VgCharacterName").value;
    
    // get rid of any leading and trailing spaces
    characterName = characterName.trim();
    
    // if there's no name to search then bail out of the function
    if(characterName.length < 1){return;}

    var nameFilter = "name:" + characterName;
    
    // call the web service, and download the file
    //console.log("loading " + gbCharsURL);
    $.ajax({
      dataType: "jsonp",
      type: "get",
      url: gbCharsURL,
      data: {filter: "name:" + characterName, sort: "id:asc", json_callback: "characterJsonLoaded", field_list:"guid,name"},
      success: characterJsonLoaded
    });
}



// get data for an anime character
function getAnimeData(){
    
    // add character text box data
    characterName = document.querySelector("#AnimeCharacterName").value;
    
    // get rid of any leading and trailing spaces
    characterName = characterName.trim();
    
    // if there's no name to search then bail out of the function
    if(characterName.length < 1){return;}
    
    var variables = {
        name: characterName
    };
    
    
    var query = "query($name: String){Character(search: $name){name {first,last} image{medium}, media(sort: [TYPE, START_DATE]){edges{voiceActors(language: ENGLISH){name{first, last} image{medium}} node{title {english, native}, type}}}}}";
    
    var url = ANILIST_API_URL,
        options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/jsonp',
                'Accept': 'application/jsonp',
            },
            body: JSON.stringify({
                query: query,
                variables: variables
            })
        };
    
    fetch(url, options).then(handleResponse).then(findRoles).catch(noCharacterFound);
    
    
}



// after searching for the video game character, the character's json is loaded
function characterJsonLoaded(obj){
    console.dir(obj);
    
    if(!checkJsonErrors(obj)){
        shiftUp();
        return;
    }
    
    var vgCharacter = obj.results[0];
    
    // get the character's GUID and add that to the URL
    
    var guid;
    var gbCharURL = GIANT_BOMB_SINGLE_CHARACTER_URL;

    guid = vgCharacter.guid;
    gbCharURL = gbCharURL + guid + "/" + GIANT_BOMB_API_KEY;

    //document.querySelector("#result").innerHTML = "<p>" + vgCharacter.name + "<p>";

    // once the url is complete, call the function to find voices
    $.ajax({
      dataType: "jsonp",
      type: "get",
      url: gbCharURL,
      data: {json_callback: "findVoiceActors", sort:"id:asc", field_list: "name,first_appeared_in_game,image,people"},
      success: findVoiceActors
    });
    
}

// greates divs on the page and displays the character that was searched
function displayCharacter(obj){
    if(searchType == searchTypes.VIDEO_GAME){
        var $characterDiv = $("<div id='CharacterDiv'></div>");
        $("#result").prepend($characterDiv);
        $("#CharacterDiv").css({
            position: "relative",
            width: "15%",
            height: "10%",
            padding: "18px",
            float: "left",
            clear: "left",
            marginLeft: "15%",
            border: "1px solid #14181f",
            borderRadius: "45px",
            background: "linear-gradient(to top, #1664aa , #4dacff)",
            boxShadow: "3px 3px 0px #14181f",
            marginBottom: "100%",
        });
        var $charImage = $("<img id='charImage' src='" + obj.results.image.medium_url + "' >");
        $("#CharacterDiv").append($charImage);
        $("#charImage").css({
            position: "relative",
            width: "50%",
            height: "50%",
            display: "block",
            marginLeft: "auto",
            marginRight: "auto"
        });
        
        var $name = $("<div class='Name'><h5>Character: </h5><p>" + obj.results.name + "</p></div>");
        $("#CharacterDiv").append($name);

        var $firstGame = $("<div class='Name'><h5>First Game: </h5><p>" + obj.results.first_appeared_in_game.name + "</p></div>");
        $("#CharacterDiv").append($firstGame);
        $(".Name").css({
            position: "relative",
            marginLeft: "20px",
            width: "90%"
        });
        $(".Name h5, .Name p").css({
            display: "inline",
        });
        $(".Name p").css({
            fontSize:"10pt",
        });
    }
    
    
    else if(searchType == searchTypes.ANIME){
        
        var animeChar = obj.data.Character;
        var $characterDiv = $("<div id='CharacterDiv'></div>");
        $("#result").prepend($characterDiv);
        $("#CharacterDiv").css({
            position: "relative",
            width: "15%",
            height: "10%",
            padding: "18px",
            float: "left",
            clear: "left",
            marginLeft: "15%",
            border: "1px solid #14181f",
            borderRadius: "45px",
            background: "linear-gradient(to top, #1664aa , #4dacff)",
            boxShadow: "3px 3px 0px #14181f",
            marginBottom: "100%",
        });
        var $charImage = $("<img id='charImage' src='" + animeChar.image.medium + "' >");
        $("#CharacterDiv").append($charImage);
        $("#charImage").css({
            position: "relative",
            width: "50%",
            height: "50%",
            display: "block",
            marginLeft: "auto",
            marginRight: "auto"
        });
        
        if (animeChar.name.last == null){
            animeChar.name.last = "";
        }
        var $name = $("<div class='Name'><h5>Character: </h5><p>" + animeChar.name.first + " " + animeChar.name.last + "</p></div>");
        $("#CharacterDiv").append($name);

        var showTitle = "Undefined";
        var edges = animeChar.media.edges;
        for (var i = 0; i < edges.length; i++){
            if(edges[i].node.title.english != null){
                showTitle = edges[i].node.title.english;
                break;
            }
        }
        
        var $title = $("<div class='Name'><h5>Title: </h5><p>" + showTitle + "</p></div>");
        $("#CharacterDiv").append($title);

        $(".Name").css({
            position: "relative",
            marginLeft: "8px",
            width: "90%"
        });
        $(".Name h5, .Name p").css({
            display: "inline",
        });
        $(".Name p").css({
            fontSize:"10pt",
        });
    }

}


// for Giant Bomb character searches, parse through the people list and find any and all English-speaking voices
function findVoiceActors(obj){
    
    //console.dir(obj);
    // display the character
    displayCharacter(obj);
    
    var people = obj.results.people;
    if(people.length == 0){
        noVoices();
        return;
    }
    gbPeopleToCheck = people.length;
    for (var i = 0; i < people.length; i++){
        
        var id = people[i].id;
        
        var gbPeopleURL = GIANT_BOMB_PEOPLE_URL + GIANT_BOMB_API_KEY;
        $.ajax({
          dataType: "jsonp",
          type: "get",
          url: gbPeopleURL,
          data: {json_callback: "findPerson", filter: "id:"+id, field_list: "name,guid"},  
          success: findPerson
        });
    }

}


// if the concept is "voice acting" and the country is the United States or Canada or the UK, add that voice actor to the list
function findPerson(obj){
    var person = obj.results[0];
    var guid = person.guid;
    var gbPersonURL = GIANT_BOMB_PERSON_URL + guid + "/" + GIANT_BOMB_API_KEY;
    
    $.ajax({
      dataType: "jsonp",
      type: "get",
      url: gbPersonURL,
      data: {json_callback: "findConcepts", field_list: "name,concepts,country,image"},
      success: findConcepts
    });
    return;
    
}

// used by the giantBomb search to find the concepts associated with that person
function findConcepts(obj){
    var concepts = obj.results.concepts;
    // help ensure that the person is an English speaker
    var country = obj.results.country;
    if(country == "U.S." || country == "US" || country == "USA"  || country == "U.S.A." || country == "U.S.A" || country == "United States" || country == "United States of America" || country == "Canada" || country == "United Kingdom" || country == "Great Britain" || country == "England" || country == "UK" || country == "U.K." || country == "Ireland" || country == "Scotland" || country == "Wales" || country == null) {
        
        for (var i = 0; i < concepts.length; i++){
            if(concepts[i].name == "Voice Acting"){
                voices.push(obj.results);
            }
        }
    }
    gbPeopleChecked ++;
    if(gbPeopleChecked >= gbPeopleToCheck){
        if(voices.length > 0){
            findRoles(obj);
        }
        // no elligible voices could be found
        else{
            noVoices();
            shiftUp();
            return;
        }
    }
}

// display voice Actor
function displayVoiceActor(voice, index){
    if(searchType == searchTypes.VIDEO_GAME) {
        var $actorContainer = $("<div id='ActorContainer" + index + "'></div")
        $("#VoiceContainer").append($actorContainer);
        $("#ActorContainer" + index).css({
            position: "relative",
            width: "100%",
            paddingBottom: "30px",
        });
        
        var $actorDiv = $("<div id='ActorDiv" + index + "'></div>");
        $("#ActorContainer" + index).append($actorDiv);
        $("#ActorDiv" + index).css({
            position: "relative",
            width: "15%",
            height: "10%",
            padding: "18px",
            marginLeft: "5%",
            border: "1px solid #14181f",
            borderRadius: "35px",
            background: "linear-gradient(to top, #1664aa , #4dacff)",
            boxShadow: "3px 3px 0px #14181f",
            float: "left",
        });
        
        var $actorImage = $("<img id='ActorImage" + index + "' src='" + voice.image.medium_url + "' >");
        $("#ActorDiv" + index).append($actorImage);
        $("#ActorImage" + index).css({
            position: "relative",
            width: "100%",
            height: "100%",
            display: "block",
            marginLeft: "auto",
            marginRight: "auto"
        });
        
        var $name = $("<div class='Name'><h5>Voice: </h5><p>" + voice.name + "</p></div>");
        $("#ActorDiv" + index).append($name);

        $(".Name").css({
            position: "relative",
            marginLeft: "8px",
            width: "90%"
        });
        $(".Name h5, .Name p").css({
            display: "inline",
        });
        $(".Name p").css({
            fontSize:"10pt",
        });
        
        var $voiceRoleContainer = $("<div id = 'VoiceRoleContainer" + voiceNum + "'></div>");
        $("#ActorContainer" + voiceNum).append($voiceRoleContainer);
        $("#VoiceRoleContainer" + voiceNum).css({
            width: "70%",
            position: "relative",
            float: "right",
            display: "inline-block",
        });
        
    }
    
    if(searchType == searchTypes.ANIME) {
        var $actorContainer = $("<div id='ActorContainer" + index + "'></div")
        $("#VoiceContainer").append($actorContainer);
        $("#ActorContainer" + index).css({
            position: "relative",
            width: "100%",
            paddingBottom: "30px",
        });
        
        var $actorDiv = $("<div id='ActorDiv" + index + "'></div>");
        $("#ActorContainer" + index).append($actorDiv);
        $("#ActorDiv" + index).css({
            position: "relative",
            width: "15%",
            height: "10%",
            padding: "18px",
            marginLeft: "5%",
            border: "1px solid #14181f",
            borderRadius: "35px",
            background: "linear-gradient(to top, #1664aa , #4dacff)",
            boxShadow: "3px 3px 0px #14181f",
            float: "left",
        });
        
        var $actorImage = $("<img id='ActorImage" + index + "' src='" + voice.image.medium + "' >");
        $("#ActorDiv" + index).append($actorImage);
        $("#ActorImage" + index).css({
            position: "relative",
            width: "100%",
            height: "100%",
            display: "block",
            marginLeft: "auto",
            marginRight: "auto"
        });
        
        var $name = $("<div class='Name'><h5>Voice: </h5><p>" + voice.name.first + voice.name.last + "</p></div>");
        $("#ActorDiv" + index).append($name);

        $(".Name").css({
            position: "relative",
            marginLeft: "8px",
            width: "90%"
        });
        $(".Name h5, .Name p").css({
            display: "inline",
        });
        $(".Name p").css({
            fontSize:"10pt",
        });
        
        var $voiceRoleContainer = $("<div id = 'VoiceRoleContainer" + voiceNum + "'></div>");
        $("#ActorContainer" + voiceNum).append($voiceRoleContainer);
        $("#VoiceRoleContainer" + voiceNum).css({
            width: "70%",
            position: "relative",
            float: "right",
            display: "inline-block",
        });
        
    }
}


// after the character is loaded, the voice actor and his/her other roles are found
function findRoles(obj){
    console.dir(obj);
    
    if(searchType == searchTypes.VIDEO_GAME){
        //console.dir(voices);
        
        for(var i = 0; i < voices.length; i++){
            voiceNum = i;
            //console.log(i);
            displayVoiceActor(voices[i], i);
            
            var variables = {
                name: voices[i].name
            };


            var query = "query($name: String){Staff(search: $name){name {first,last} characters(sort: ID){ nodes{name{first, last}, image{medium}, siteUrl, media(sort:[TYPE,START_DATE]){nodes{title{english, native}}}}}}}";

            var url = ANILIST_API_URL,
                options = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/jsonp',
                        'Accept': 'application/jsonp',
                    },
                    body: JSON.stringify({
                        query: query,
                        variables: variables
                    })
                
                };

            fetch(url, options).then(handleResponse).then(listVoices).catch(noActorFound);
        }
    }
    
    else if(searchType == searchTypes.ANIME){
        
        displayCharacter(obj);
        
        var edges = obj.data.Character.media.edges;
        for (var i = 0; i < edges.length; i++){
            
            if(edges[i].voiceActors.length == 0){
                continue;
            }
            
            for(var j = 0; j < edges[i].voiceActors.length; j++){
                var voice = edges[i].voiceActors[j];
                
                voices.push(voice);
            }
            break;
        }
        
        // if no english voices could be found
        if(voices.length == 0){
            shiftUp();
            noVoices();
            return;
        }
    
        
        var roleNameFirst = obj.data.Character.name.first;
        var roleNameLast = obj.data.Character.name.last;
        var roleName = roleNameFirst + " " + roleNameLast;
        
        for(var i = 0; i < voices.length; i++){
            voiceNum = i;
            displayVoiceActor(voices[i], i);
            var voiceFirstName = voices[i].name.first;
            var voiceLastName = voices[i].name.last;
            voiceName = voiceFirstName + " " + voiceLastName;
            var gbPeopleURL;
            console.log(voiceName);
            
            // the special case for Steve Blum
            if (voiceName == "Steven Blum"){
                voiceName = "Steve Blum";
            }
            
            // the special case for Sonny Strait
            if(voiceName == "Sonny Strait"){
                voiceName = "Don Strait";
            }
            
            // the special case for Justin Cook (who has the same name as a different game dev)
            // for some reason, Giant Bomb doesn't have any characters listed for this guy, but that's life I guess
            if(voiceName == "Justin Cook"){
                gbPeopleURL = GIANT_BOMB_PEOPLE_URL + GIANT_BOMB_API_KEY + "&json_callback=voiceJsonLoaded&filter=id:149459";
            }
            else {
                gbPeopleURL = GIANT_BOMB_PEOPLE_URL + GIANT_BOMB_API_KEY + "&json_callback=voiceJsonLoaded&filter=name:" + voiceName;
            }
            
            //console.log("loading " + gbPeopleURL);
            $.ajax({
              dataType: "jsonp",
              type: "get",
              url: gbPeopleURL,
              data: {field_list: "guid"},
              success: voiceJsonLoaded
            });
        }
    }
}



function voiceJsonLoaded(obj){
    //console.dir(obj);
    
    if(!checkJsonErrors(obj)){
        shiftUp();
        return;
    }
    
    var allVoices = obj.results;
    
    for(var i = 0; i < allVoices.length; i++){
        var guid = allVoices[i].guid;
        var gbPersonURL = GIANT_BOMB_PERSON_URL;
        gbPersonURL = gbPersonURL + guid + "/" + GIANT_BOMB_API_KEY;
             
        $.ajax({
          dataType: "jsonp",
          type: "get",
          url: gbPersonURL,
          data: {json_callback: "listVoices", field_list: "characters"},
          success: listVoices
        });
    }
}



// display the actor's other roles
function displayOtherRoles(index, obj){
    
    if(searchType == searchTypes.VIDEO_GAME){
        var role = otherRoles[index];

        //console.log(voiceNum);
        var $roleDiv = $("<div id='RoleDiv" + otherRoleCount + "'></div>");
        $("#VoiceRoleContainer" + index).append($roleDiv);
        $("#RoleDiv" + otherRoleCount).css({
            position: "relative",
            width: "20%",
            height: "280px",
            padding: "10px",
            marginLeft: "5%",
            marginBottom: "5%",
            border: "1px solid #14181f",
            borderRadius: "35px",
            background: "linear-gradient(to top, #1664aa , #4dacff)",
            boxShadow: "3px 3px 0px #14181f",
            display: "inline-block",
            verticalAlign: "top",
            overflow: "hidden"
        });


        var $roleImage = $("<img id='RoleImage" + otherRoleCount + "' src='" + role.image.medium + "' >");
        $("#RoleDiv" + otherRoleCount).append($roleImage);
        $("#RoleImage" + otherRoleCount).css({
            position: "relative",
            width: "80%",
            height: "30%",
            display: "block",
            marginLeft: "auto",
            marginRight: "auto"
        });

        if (role.name.last == null){
            role.name.last = "";
        }
        var $name = $("<div class='Name'><h5>Character: </h5><p>" + role.name.first + " " + role.name.last + "</p></div>");

        var showTitle = "Undefined";
        for (var j = 0; j < role.media.nodes.length; j++){
            if(role.media.nodes[j].title.english != null){
                showTitle = role.media.nodes[j].title.english;
                break;
            }
        }

        $("#RoleDiv" + otherRoleCount).append($name);
        var $title = $("<div class='Name'><h5>Title: </h5><p>" + showTitle + "</p></div>");
        $("#RoleDiv" + otherRoleCount).append($title);

        $(".Name").css({
            position: "relative",
            marginLeft: "8px",
            width: "90%"
        });
        $(".Name h5, .Name p").css({
            display: "inline",
        });
        $(".Name p").css({
            fontSize:"10pt",
        });

        //console.log(otherRoleCount);

    }
    
    
    
    else if(searchType == searchTypes.ANIME){
        var role = obj[0];
        //console.dir(role);

        //console.log(voiceNum);
        var $roleDiv = $("<div id='RoleDiv" + otherRoleCount + "'></div>");
        $("#VoiceRoleContainer" + voiceNum).append($roleDiv);
        $("#RoleDiv" + otherRoleCount).css({
            position: "relative",
            width: "20%",
            height: "280px",
            padding: "10px",
            marginLeft: "5%",
            marginBottom: "5%",
            border: "1px solid #14181f",
            borderRadius: "35px",
            background: "linear-gradient(to top, #1664aa , #4dacff)",
            boxShadow: "3px 3px 0px #14181f",
            display: "inline-block",
            verticalAlign: "top",
            overflow: "hidden"
        });


        var $roleImage = $("<img id='RoleImage" + otherRoleCount + "' src='" + role.image.medium_url + "' >");
        $("#RoleDiv" + otherRoleCount).append($roleImage);
        $("#RoleImage" + otherRoleCount).css({
            position: "relative",
            width: "80%",
            height: "30%",
            display: "block",
            marginLeft: "auto",
            marginRight: "auto"
        });

        
        var $name = $("<div class='Name'><h5>Character: </h5><p>" + role.name + "</p></div>");
        $("#RoleDiv"+ otherRoleCount).append($name);

        var $firstGame = $("<div class='Name'><h5>First Game: </h5><p>" + role.first_appeared_in_game.name + "</p></div>");
        $("#RoleDiv"+ otherRoleCount).append($firstGame);
        $(".Name").css({
            position: "relative",
            marginLeft: "5%",
            width: "90%"
        });
        $(".Name h5, .Name p").css({
            display: "inline",
        });
        $(".Name p").css({
            fontSize:"10pt",
        });

        //console.log(otherRoleCount);

    }
    
        
}




// the final step in the searching process where other roles of the voice actor will be displayed
function listVoices(obj){
    
    //console.log("Here are some other roles this actor has been in:");
    // the user searched for a video game character, so now anime roles will be displayed
    if(searchType == searchTypes.VIDEO_GAME){
        otherRoles = [];
        
        var animeCharacters = obj.data.Staff.characters.nodes;
        
        for(var i = 0; i < animeCharacters.length; i++){
            otherRoles.push(animeCharacters[i]);
            displayOtherRoles(i);
            otherRoleCount++;
        }
        
        
        console.dir(otherRoles);
        
    }
    
    // the user searched for an anime character, so now video game roles will be displayed
    else if(searchType == searchTypes.ANIME){
        otherRoles = [];
        var videoGameCharacters = obj.results.characters;
        //console.dir(videoGameCharacters);
        
        // no video game roles could be found for this voice
        if(videoGameCharacters.length == 0){
            
        }
        
        // loop through characters and get ids and search for images based on that character id
        for(var i = 0; i < videoGameCharacters.length; i++){
            var id = videoGameCharacters[i].id;
            
            var gbCharURL = GIANT_BOMB_CHARACTERS_URL + GIANT_BOMB_API_KEY + "&json_callback=findGBCharImagesAndGames&filter=id:" + id;
            $.ajax({
              dataType: "jsonp",
              type: "get",
              url: gbCharURL,
              data: {field_list: "name,image,first_appeared_in_game,site_detail_url"},  
              success: findGBCharImagesAndGames
            });
            
        }
    }
    
    shiftUp();
}



// after searching one final time through the Giant Bomb API, the character's object containing
// the name, image, and game/franchise is found and added to the otherRoles array
function findGBCharImagesAndGames(obj){
    var characterObject = obj.results;
    //console.dir(characterObject);
    otherRoles.push(characterObject);
    displayOtherRoles(otherRoleCount, characterObject);
    
    otherRoleCount++;
    
    
}
            


// function to get back a json object from anilist search
function handleResponse(response) {
    return response.json().then(function (json) {
        return response.ok ? json : Promise.reject(json);
    });
}

// if there is no result when searching aniList for a character
function noCharacterFound(error) {
    shiftUp();
    var status = "No characters could be found";
    document.querySelector("#result").innerHTML = "<p><i>" + status + "</i><p>" + "<p><i>";
    //$("#result").fadeIn(500);
}

// if there is no result when searching anilist for a voice actor
function noActorFound(error) {
    shiftUp();
    var status = "The voice actor could not be found";
    document.querySelector("#result").innerHTML = "<p><i>" + status + "</i><p>" + "<p><i>";
    //$("#result").fadeIn(500);
}



// function used to check for any errors in json returned from Giant Bomb
function checkJsonErrors(obj){
    // if there's an error, print a message and return
    if(obj.error != "OK"){
        var status = obj.error;
        document.querySelector("#result").innerHTML = "<h3><b>Error!</b></h3>" + "<p><i>" + status + "</i><p>";
        //$("#result").fadeIn(500);
        return false; // Bail out
    }
    
    // if there are no results, print a message and return
    if(obj.number_of_total_results == 0){
        var status = "No character found";
        document.querySelector("#result").innerHTML = "<p><i>" + status + "</i><p>" + "<p><i>";
        //$("#result").fadeIn(500);
        return false; // Bail out
    }
    
    return true;
}



// displays that no voices could be found
function noVoices(){
    var status = "No voices could be found";
    document.querySelector("#result").innerHTML = "<p><i>" + status + "</i><p>" + "<p><i>";
    $("#result").fadeIn(500);
}

// displays that no characters could be Found
function noCharacters(){
    var status = "No characters could be found";
    document.querySelector("#result").innerHTML = "<p><i>" + status + "</i><p>" + "<p><i>";
    $("#result").fadeIn(500);
}