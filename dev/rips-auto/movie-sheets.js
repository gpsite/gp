//saving the code so you can see it and we don't lose it
//bascially it takes OMDB, pulls the info, and spits it out into the spreasheet
//ask before you touch
function OMDB_DETAILS(omdbId) {
  var apiKey = '321a04fd';
  if (!omdbId || !apiKey) return [['Missing OMDB ID or API Key', '', '', '', '', '']];
  var url = 'https://www.omdbapi.com/?i=' + omdbId + '&apikey=' + apiKey;
  try {
    var response = UrlFetchApp.fetch(url);
    var movie = JSON.parse(response.getContentText());
    if (movie.Response === 'False') {
      return [['Not found', '', '', '', '', '']];
    }
    return [[
      movie.Title,
      movie.Genre,
      movie.Year,
      movie.Director,
      movie.Actors,
      movie.Plot,
      movie.Poster
    ]]
  } catch (e) {
    return [['Error: ' + e.message, '', '', '', '', '']];
  }
}
