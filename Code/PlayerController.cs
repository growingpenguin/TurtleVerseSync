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
    private string serverUrl = "http://192.168.0.54:8080";
    private float rotationSpeed = 0;
    private float moveSpeed = 0;
    private float rotationAcceleration = 1.0f; // Degrees per frame while key is held
    private float moveAcceleration = 0.1f; // Units per frame while key is held
    private float maxRotationSpeed = 90; // Maximum degrees per second
    private float maxMoveSpeed = 5; // Maximum units per second

    void Start()
    {
        Application.targetFrameRate = 60;
    }

    void Update()
    {
        // Handle rotation acceleration
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
        // Apply rotation
        transform.Rotate(0, 0, rotationSpeed * Time.deltaTime);

        // Handle linear movement acceleration
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
        // Apply movement
        transform.Translate(0, moveSpeed * Time.deltaTime, 0);

        // Handle space bar press to stop
        if (Input.GetKeyDown(KeyCode.Space))
        {
            rotationSpeed = 0;
            moveSpeed = 0;
            SendData("stop", "/stop");  // Send stop command
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
        GameData data = new GameData()
        {
            action = action,
            time = Time.time
        };

        StartCoroutine(PostData(serverUrl + apiEndpoint, data));
    }

    IEnumerator PostData(string url, GameData data)
    {
        string json = JsonUtility.ToJson(data);
        Debug.Log("Sending JSON: " + json);  // Log the JSON string to ensure it's correctly formatted

        byte[] jsonToSend = new System.Text.UTF8Encoding().GetBytes(json);
        UnityWebRequest request = UnityWebRequest.PostWwwForm(url, "application/json");
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
}
