import json
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options

def lambda_handler(event, context):
    title = event.get('title')
    if not title:
        return {"statusCode": 400, "body": "Missing movie title"}

    # Set up headless Chrome
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    driver = webdriver.Chrome(options=chrome_options)

    try:
        # 1. Visit login page
        driver.get("https://third-party-site.com/login")
        driver.find_element(By.ID, "username").send_keys("YOUR_USERNAME")
        driver.find_element(By.ID, "password").send_keys("YOUR_PASSWORD")
        driver.find_element(By.ID, "login-btn").click()
        
        # 2. Navigate, press buttons, enter text, etc.
        # Example:
        # driver.find_element(By.ID, "search-btn").click()
        # driver.find_element(By.ID, "search-box").send_keys(title)
        # driver.find_element(By.ID, "submit-btn").click()

        # 3. Wait for results, extract line
        # line_element = driver.find_element(By.CSS_SELECTOR, ".desired-line")
        # line_text = line_element.text

        # For demonstration:
        line_text = "Extracted line for " + title

        return {
            "statusCode": 200,
            "body": json.dumps({"line": line_text})
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
    finally:
        driver.quit()