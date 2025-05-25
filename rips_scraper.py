import requests
from bs4 import BeautifulSoup

BASE_URL = 'https://ee3.me'
USERNAME = '_sf_'
PASSWORD = 'defonotscraping'

def login(session):
    url = f"{BASE_URL}/login"
    data = {'user': USERNAME, 'pass': PASSWORD, 'action': 'login'}
    resp = session.post(url, data=data)
    resp.raise_for_status()

    res_json = resp.json()
    if res_json['status'] != 1:
        raise Exception("Login failed")

    return session.cookies.get('PHPSESSID')

def search_movies(session, query):
    url = f"{BASE_URL}/get"
    data = {'query': query, 'action': 'search'}
    resp = session.post(url, data=data)
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, 'html.parser')
    results = []

    for div in soup.find_all('div'):
        title_tag = div.select_one('.title')
        year_tag = div.select_one('.details span')
        id_attr = div.select_one('.control-buttons')
        if title_tag and year_tag and id_attr:
            title = title_tag.text.strip()
            try:
                year = int(year_tag.text.strip())
            except:
                year = None
            movie_id = id_attr.get('data-id')
            if title and year and movie_id:
                results.append({'title': title, 'year': year, 'id': movie_id})
    return results

def get_movie_details(session, movie_id):
    url = f"{BASE_URL}/get"
    data = {'id': movie_id, 'action': 'get_movie_info'}
    resp = session.post(url, data=data)
    resp.raise_for_status()
    return resp.json()

def get_key(session):
    url = f"{BASE_URL}/renew"
    resp = session.post(url)
    resp.raise_for_status()
    return resp.json()

def main():
    with requests.Session() as session:
        print("Logging in...")
        login(session)
        print("Searching for movies...")
        movies = search_movies(session, "Movie Title")

        if not movies:
            print("No movies found.")
            return

        movie = movies[0]
        print(f"Getting details for {movie['title']} ({movie['year']})...")
        details = get_movie_details(session, movie['id'])
        if not details['message']['video']:
            print("No video stream found.")
            return

        key_data = get_key(session)
        key = key_data.get('k')
        if not key:
            print("Failed to get key.")
            return

        server = 'https://vid.ee3.me/vid/' if details['message']['server'] == '1' else 'https://vault.rips.cc/video/'
        video_url = f"{server}{details['message']['video']}?k={key}"

        print(f"Video URL: {video_url}")
        if details['message'].get('subs') == 'yes' and details['message'].get('imdbID'):
            subtitle_url = f"https://rips.cc/subs/{details['message']['imdbID']}.vtt"
            print(f"Subtitle URL: {subtitle_url}")

if __name__ == '__main__':
    main()
