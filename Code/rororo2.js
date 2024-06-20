using System.Collections;
using UnityEngine;
using UnityEngine.Networking;

[System.Serializable]
public class GameData
{
    public string action;
    public float time;
}

public class PlayerController : MonoBehaviour
{
    private string serverUrl = "http://localhost:8080";
    private float rotationSpeed = 0;
    private float moveSpeed = 0;
    private float rotationAcceleration = 10; // Degrees per frame while key is held
    private float moveAcceleration = 0.1f; // Units per frame while key is held
    private float maxRotationSpeed = 90; // Maximum degrees per second
    private float maxMoveSpeed = 5; // Maximum units per second

    void Start()
    {
        Application.targetFrameRate = 60;
    }

    void Update()
    {
        // Handle input for rotation and movement
        HandleInput();
    }

    private void HandleInput()
    {
        if (Input.GetKey(KeyCode.LeftArrow))
        {
            rotationSpeed += rotationAcceleration;
            rotationSpeed = Mathf.Clamp(rotationSpeed, -maxRotationSpeed, maxRotationSpeed);
            SendData("left", "/left");
        }
        else if (Input.GetKey(KeyCode.RightArrow))
        {
            rotationSpeed -= rotationAcceleration;
            rotationSpeed = Mathf.Clamp(rotationSpeed, -maxRotationSpeed, maxRotationSpeed);
            SendData("right", "/right");
        }
        transform.Rotate(0, 0, rotationSpeed * Time.deltaTime);

        if (Input.GetKey(KeyCode.UpArrow))
        {
            moveSpeed += moveAcceleration;
            moveSpeed = Mathf.Clamp(moveSpeed, -maxMoveSpeed, maxMoveSpeed);
            SendData("up", "/up");
        }
        else if (Input.GetKey(KeyCode.DownArrow))
        {
            moveSpeed -= moveAcceleration;
            moveSpeed = Mathf.Clamp(moveSpeed, -maxMoveSpeed, maxMoveSpeed);
            SendData("down", "/down");
        }
        transform.Translate(0, moveSpeed * Time.deltaTime, 0);

        if (Input.GetKeyDown(KeyCode.Space))
        {
            SendCommand("/stop");
        }
    }

    private void OnCollisionEnter(Collision collision)
    {
        if (collision.gameObject.tag == "Arrow")
        {
            SendData("ouch", "/api/collision");
        }
    }

    private void SendData(string action, string apiEndpoint)
    {
        GameData data = new GameData
        {
            action = action,
            time = Time.time
        };
        StartCoroutine(PostData(serverUrl + apiEndpoint, data));
    }

    private void SendCommand(string apiEndpoint)
    {
        StartCoroutine(PostCommand(serverUrl + apiEndpoint));
    }

    IEnumerator PostData(string url, GameData data)
    {
        string json = JsonUtility.ToJson(data);
        Debug.Log("Sending JSON: " + json);
        byte[] jsonToSend = new System.Text.UTF8Encoding().GetBytes(json);
        UnityWebRequest request = UnityWebRequest.Post(url, "application/json");
        request.uploadHandler = new UploadHandlerRaw(jsonToSend);
        request.downloadHandler = new DownloadHandlerBuffer();
        request.SetRequestHeader("Content-Type", "application/json");
        yield return request.SendWebRequest();

        if (request.result != UnityWebRequest.Result.Success)
        {
            Debug.LogError("Error while sending data: " + request.error);
        }
        else
        {
            Debug.Log("Successfully sent data to " + url + ". Server response: " + request.downloadHandler.text);
        }
    }

    IEnumerator PostCommand(string url)
    {
        UnityWebRequest request = UnityWebRequest.Post(url, "");
        request.downloadHandler = new DownloadHandlerBuffer();
        request.SetRequestHeader("Content-Type", "application/json");
        yield return request.SendWebRequest();

        if (request.result != UnityWebRequest.Result.Success)
        {
            Debug.LogError("Error while sending command: " + request.error);
        }
        else
        {
            Debug.Log("Successfully sent command to " + url + ". Server response: " + request.downloadHandler.text);
        }
    }
}
