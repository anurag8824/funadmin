# Backend API Documentation - Complete Testing Guide

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Firebase Usage](#firebase-usage)
3. [MongoDB Usage](#mongodb-usage)
4. [Authentication](#authentication)
5. [API Endpoints](#api-endpoints)
6. [Issues & Critical Bugs](#issues--critical-bugs)

---

## Architecture Overview

### Tech Stack
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB (via Mongoose ODM)
- **Push Notifications**: Firebase Admin SDK (FCM)
- **File Storage**: Local / AWS S3 / DigitalOcean Spaces
- **Real-time**: Socket.io
- **Authentication**: JWT (for admin), Secret Key (for client)
- **Video Processing**: FFmpeg (for compression)

### Project Structure
```
backend/
├── controllers/     # Business logic (admin/ & client/)
├── models/          # MongoDB schemas
├── routes/          # API routes (admin/ & client/)
├── middleware/      # Auth middleware
├── util/            # Helpers (connection, storage, compression)
├── socket.js        # Socket.io real-time events
├── index.js         # Server entry point
└── checkAccess.js   # Secret key validation
```

### Base URLs
- **Admin APIs**: `/admin/*`
- **Client APIs**: `/client/*`
- **Secret Key**: Required in header `key: <secretKey>` for all endpoints
- **Admin Token**: Required in header `Authorization: <JWT>` for admin-protected routes

---

## Firebase Usage

### Purpose
Firebase Admin SDK is used **exclusively for push notifications** (FCM - Firebase Cloud Messaging).

### Implementation
- **Initialization**: `util/privateKey.js` - Initializes Firebase Admin SDK using credentials from `Setting.privateKey`
- **Usage**: Used in controllers to send push notifications when:
  - User receives likes/comments on posts/videos
  - User receives gifts
  - Content moderation (banned content notifications)
  - Withdrawal request status updates
  - Verification request status updates
  - Admin actions (complaint resolution, etc.)

### Firebase Configuration
Stored in MongoDB `Setting` model:
```json
{
  "privateKey": {
    "type": "service_account",
    "project_id": "...",
    "private_key_id": "...",
    "private_key": "...",
    "client_email": "...",
    "client_x509_cert_url": "..."
  }
}
```

### Example Usage (from controllers)
```javascript
const admin = require("firebase-admin");
admin.messaging().send({
  token: user.fcmToken,
  notification: {
    title: "Video Liked",
    body: "Someone liked your video"
  }
});
```

---

## MongoDB Usage

### Purpose
MongoDB stores **all application data** via Mongoose schemas.

### Collections (Models)
1. **User** - User profiles, authentication, coins, FCM tokens
2. **Video** - Reels/shorts videos (URL, caption, hashtags, song)
3. **Post** - Image posts (similar to video)
4. **Story** - 24-hour stories (image/video)
5. **Song** - Audio tracks for reels
6. **HashTag** - Hashtags used in posts/videos
7. **LikeHistoryOfPostOrVideo** - Likes on posts/videos
8. **PostOrVideoComment** - Comments on posts/videos
9. **LikeHistoryOfPostOrVideoComment** - Likes on comments
10. **FollowerFollowing** - User follow relationships
11. **Notification** - In-app notifications
12. **WatchHistory** - Video watch history
13. **Gift** - Virtual gifts
14. **History** - Coin transactions (gifts, purchases, withdrawals)
15. **WithdrawRequest** - Withdrawal requests
16. **CoinPlan** - Coin purchase plans
17. **Report** - User reports
18. **Complaint** - User complaints
19. **VerificationRequest** - Account verification requests
20. **Banner** - App banners
21. **Setting** - App-wide settings (payment gateways, storage, moderation)
22. **Admin** - Admin accounts
23. **LiveVideo** - Fake live videos
24. **LiveUser** - Live streaming users
25. **ChatTopic** - Chat conversations
26. **Chat** - Chat messages
27. **ChatRequest** - Chat request management
28. **SearchHistory** - User search history
29. **Reaction** - Reactions (emojis)
30. **Currency** - Currency settings
31. **ReportReason** - Report reason templates

### Connection
- **File**: `util/connection.js`
- **Connection String**: `process.env.MongoDb_Connection_String`
- **Global Settings**: Loaded from `Setting` model into `global.settingJSON` on startup

---

## Authentication

### Client APIs
- **Method**: Secret Key in header
- **Header**: `key: <process.env.secretKey>`
- **Middleware**: `checkAccess.js`
- **Error**: `{ status: false, error: "Unpermitted infiltration" }` if invalid/missing

### Admin APIs
- **Method**: JWT token in header
- **Header**: `Authorization: <JWT>`
- **Middleware**: `middleware/admin.middleware.js`
- **Error**: `{ status: false, message: "Oops ! You are not authorized." }` if invalid/missing

---

## API Endpoints

### Common Request Headers
```json
{
  "key": "YOUR_SECRET_KEY",
  "Content-Type": "application/json"
}
```

### Common Response Format
```json
{
  "status": true/false,
  "message": "Success/Error message",
  "data": {} // Optional
}
```

---

## Client APIs (`/client/*`)

### 1. User Management

#### 1.1 Check User Exists
- **Endpoint**: `POST /client/user/checkUser`
- **Headers**: `key: <secretKey>`
- **Request Body**:
```json
{
  "identity": "user@example.com",
  "loginType": 3
}
```
- **Response**:
```json
{
  "status": true,
  "message": "User exists",
  "data": {
    "_id": "...",
    "name": "John Doe",
    "userName": "johndoe",
    "image": "https://...",
    "isExists": true
  }
}
```

#### 1.2 Login or Sign Up
- **Endpoint**: `POST /client/user/loginOrSignUp`
- **Headers**: `key: <secretKey>`
- **Request Body**:
```json
{
  "identity": "user@example.com",
  "loginType": 1,
  "fcmToken": "firebase_fcm_token",
  "name": "John Doe",
  "userName": "johndoe",
  "image": "https://..."
}
```
- **Response**:
```json
{
  "status": true,
  "message": "User logged in successfully",
  "data": {
    "_id": "...",
    "name": "John Doe",
    "userName": "johndoe",
    "image": "https://...",
    "coin": 5000,
    "token": "jwt_token_here"
  }
}
```

#### 1.3 Update Profile
- **Endpoint**: `PATCH /client/user/update`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>`
- **Request Body**:
```json
{
  "name": "John Doe Updated",
  "userName": "johndoe",
  "image": "https://...",
  "bio": "My bio"
}
```
- **Response**:
```json
{
  "status": true,
  "message": "Profile updated successfully",
  "data": { ... }
}
```

#### 1.4 Get Profile
- **Endpoint**: `GET /client/user/getProfile`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>`
- **Response**:
```json
{
  "status": true,
  "message": "User profile retrieved",
  "data": {
    "_id": "...",
    "name": "John Doe",
    "userName": "johndoe",
    "image": "https://...",
    "coin": 5000,
    "isVerified": false
  }
}
```

#### 1.5 Get User Profile (Detailed)
- **Endpoint**: `GET /client/user/getUserProfile`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>&loginUserId=<loginUserId>`
- **Response**:
```json
{
  "status": true,
  "message": "User profile with counts",
  "data": {
    "_id": "...",
    "name": "John Doe",
    "totalFollowers": 100,
    "totalFollowing": 50,
    "totalVideos": 25,
    "totalPosts": 10,
    "totalLikes": 500
  }
}
```

#### 1.6 Get User Coin
- **Endpoint**: `GET /client/user/getUserCoin`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>`
- **Response**:
```json
{
  "status": true,
  "message": "User coin retrieved",
  "data": {
    "coin": 5000
  }
}
```

#### 1.7 Update Password
- **Endpoint**: `PATCH /client/user/updatePassword`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>`
- **Request Body**:
```json
{
  "oldPassword": "oldpass123",
  "newPassword": "newpass123"
}
```

#### 1.8 Set Password
- **Endpoint**: `PATCH /client/user/setPassword`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>`
- **Request Body**:
```json
{
  "password": "newpass123"
}
```

#### 1.9 Delete User Account
- **Endpoint**: `DELETE /client/user/deleteUserAccount`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>`

#### 1.10 Validate Username
- **Endpoint**: `GET /client/user/validateUsername`
- **Headers**: `key: <secretKey>`
- **Query**: `?userName=johndoe`
- **Response**:
```json
{
  "status": true,
  "message": "Username is available",
  "isAvailable": true
}
```

#### 1.11 Generate Media Tags (AI Caption/Hashtags)
- **Endpoint**: `GET /client/user/generateMediaTags`
- **Headers**: `key: <secretKey>`
- **Query**: `?mediaUrl=https://...&userId=<userId>`
- **Response**:
```json
{
  "status": true,
  "message": "Tags generated",
  "data": {
    "caption": "Beautiful sunset",
    "hashtags": ["#sunset", "#nature"]
  }
}
```

---

### 2. Video (Reels) Management

#### 2.1 Upload Video
- **Endpoint**: `POST /client/video/uploadvideo`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>`
- **Request Body**:
```json
{
  "videoUrl": "https://storage.../video.mp4",
  "videoImage": "https://storage.../thumbnail.jpg",
  "videoTime": 30,
  "caption": "My awesome reel",
  "hashTagId": "tag1,tag2",
  "songId": "song_id_here"
}
```
- **Response**:
```json
{
  "status": true,
  "message": "Video has been uploaded by the user.",
  "data": {
    "_id": "...",
    "videoUrl": "https://...",
    "caption": "My awesome reel",
    "videoTime": 30
  }
}
```

#### 2.2 Update Video
- **Endpoint**: `PATCH /client/video/updateVideoByUser`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>&videoId=<videoId>`
- **Request Body**:
```json
{
  "caption": "Updated caption",
  "hashTagId": "tag1,tag2"
}
```

#### 2.3 Get Videos of User
- **Endpoint**: `GET /client/video/videosOfUser`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>&loginUserId=<loginUserId>&start=1&limit=20`
- **Response**:
```json
{
  "status": true,
  "message": "Videos of the particular user.",
  "data": [
    {
      "_id": "...",
      "videoUrl": "https://...",
      "videoImage": "https://...",
      "caption": "...",
      "totalLikes": 100,
      "totalComments": 20,
      "isLike": false,
      "userId": "...",
      "name": "John Doe",
      "userImage": "https://..."
    }
  ]
}
```

#### 2.4 Get All Videos (Reels Feed)
- **Endpoint**: `GET /client/video/getAllVideos`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>&start=1&limit=20&videoId=<optionalVideoId>`
- **Response**: Same format as 2.3

#### 2.5 Delete Video
- **Endpoint**: `DELETE /client/video/deleteVideoOfUser`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>&videoId=<videoId>`

#### 2.6 Like/Dislike Video
- **Endpoint**: `POST /client/video/likeOrDislikeOfVideo`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>&videoId=<videoId>`
- **Response**:
```json
{
  "status": true,
  "message": "Video liked successfully"
}
```

#### 2.7 Share Video
- **Endpoint**: `POST /client/video/shareCountOfVideo`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>&videoId=<videoId>`

#### 2.8 Delete Particular Video
- **Endpoint**: `DELETE /client/video/deleteParticularVideo`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>&videoId=<videoId>`

#### 2.9 Get Videos of Song
- **Endpoint**: `GET /client/video/fetchVideosOfParticularSong`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>&songId=<songId>&start=1&limit=20`

#### 2.10 Get User Videos (Web)
- **Endpoint**: `GET /client/video/fetchUserVideos`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>&loginUserId=<loginUserId>&start=1&limit=20`

#### 2.11 Get Video Library (Web)
- **Endpoint**: `GET /client/video/getVideoLibrary`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>&start=1&limit=20`

---

### 3. Post Management

#### 3.1 Upload Post
- **Endpoint**: `POST /client/post/uploadPost`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>`
- **Request Body**:
```json
{
  "postImage": "https://storage.../image.jpg",
  "caption": "My post",
  "hashTagId": "tag1,tag2",
  "location": "New York",
  "locationCoordinates": {
    "latitude": "40.7128",
    "longitude": "-74.0060"
  }
}
```

#### 3.2 Update Post
- **Endpoint**: `PATCH /client/post/updatePostByUser`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>&postId=<postId>`
- **Request Body**: Same as 3.1

#### 3.3 Get All Posts (Feed)
- **Endpoint**: `GET /client/post/getAllPosts`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>&start=1&limit=20&postId=<optionalPostId>`

#### 3.4 Get Posts of User
- **Endpoint**: `GET /client/post/postsOfUser`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>&loginUserId=<loginUserId>&start=1&limit=20`

#### 3.5 Delete Post
- **Endpoint**: `DELETE /client/post/deletePostOfUser`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>&postId=<postId>`

#### 3.6 Like/Dislike Post
- **Endpoint**: `POST /client/post/likeOrDislikeOfPost`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>&postId=<postId>`

#### 3.7 Share Post
- **Endpoint**: `POST /client/post/shareCountOfPost`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>&postId=<postId>`

#### 3.8 Delete Particular Post
- **Endpoint**: `DELETE /client/post/deleteParticularPost`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>&postId=<postId>`

#### 3.9 Get Posts of User (Web)
- **Endpoint**: `GET /client/post/postsOfUserWeb`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>&loginUserId=<loginUserId>&start=1&limit=20`

#### 3.10 Retrieve All Posts
- **Endpoint**: `GET /client/post/retrieveAllPosts`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>&start=1&limit=20`

---

### 4. Comments

#### 4.1 Create Comment
- **Endpoint**: `POST /client/postOrvideoComment/commentOfPostOrVideo`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>`
- **Request Body**:
```json
{
  "commentType": 1,
  "commentTypeId": "post_or_video_id",
  "comment": "Great content!"
}
```
- **Note**: `commentType`: 1 = Post, 2 = Video

#### 4.2 Like/Dislike Comment
- **Endpoint**: `POST /client/postOrvideoComment/likeOrDislikeOfComment`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>&commentId=<commentId>`

#### 4.3 Get Comments
- **Endpoint**: `GET /client/postOrvideoComment/getpostOrvideoComments`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>&commentType=1&commentTypeId=<post_or_video_id>&start=1&limit=20`
- **Response**:
```json
{
  "status": true,
  "message": "Comments retrieved",
  "data": [
    {
      "_id": "...",
      "comment": "Great content!",
      "userId": "...",
      "name": "John Doe",
      "userImage": "https://...",
      "totalLikes": 5,
      "isLike": false,
      "createdAt": "..."
    }
  ]
}
```

---

### 5. Follow/Unfollow

#### 5.1 Follow/Unfollow User
- **Endpoint**: `POST /client/followerFollowing/followOrUnfollow`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>&otherUserId=<otherUserId>`
- **Response**:
```json
{
  "status": true,
  "message": "User followed successfully",
  "isFollow": true
}
```

#### 5.2 Get Followers
- **Endpoint**: `GET /client/followerFollowing/getFollowers`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>&loginUserId=<loginUserId>&start=1&limit=20`

#### 5.3 Get Following
- **Endpoint**: `GET /client/followerFollowing/getFollowing`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>&loginUserId=<loginUserId>&start=1&limit=20`

---

### 6. Story Management

#### 6.1 Upload Story
- **Endpoint**: `POST /client/story/uploadStory`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>`
- **Request Body**:
```json
{
  "storyType": 2,
  "mediaImageUrl": [],
  "mediaVideoUrl": [{"path": "https://storage.../video.mp4"}],
  "backgroundSong": "song_id",
  "duration": 15
}
```
- **Note**: `storyType`: 1 = Image, 2 = Video

#### 6.2 React to Story
- **Endpoint**: `POST /client/story/reactToStory`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>&storyId=<storyId>`
- **Request Body**:
```json
{
  "reaction": "❤️"
}
```

#### 6.3 Reply to Story
- **Endpoint**: `POST /client/story/replyToStory`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>&storyId=<storyId>`
- **Request Body**:
```json
{
  "reply": "Nice story!"
}
```

#### 6.4 View Story
- **Endpoint**: `POST /client/story/viewStory`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>&storyId=<storyId>`

#### 6.5 Delete Story
- **Endpoint**: `DELETE /client/story/deleteStory`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>&storyId=<storyId>`

#### 6.6 Get Followed User Stories
- **Endpoint**: `GET /client/story/getFollowedUserStories`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>`
- **Response**:
```json
{
  "status": true,
  "message": "Stories retrieved",
  "data": [
    {
      "_id": "...",
      "user": {
        "_id": "...",
        "name": "John Doe",
        "userImage": "https://..."
      },
      "stories": [
        {
          "_id": "...",
          "mediaVideoUrl": "https://...",
          "createdAt": "...",
          "viewsCount": 10
        }
      ]
    }
  ]
}
```

#### 6.7 Get Own Stories
- **Endpoint**: `GET /client/story/getOwnStories`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>`

#### 6.8 Get Story Viewers
- **Endpoint**: `GET /client/storyView/getStoryViewers`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>&storyId=<storyId>&start=1&limit=20`

---

### 7. Live Streaming

#### 7.1 Go Live
- **Endpoint**: `POST /client/liveUser/live`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>`
- **Request Body**:
```json
{
  "liveStreamMode": 1,
  "videoUrl": "https://...",
  "videoImage": "https://...",
  "videoTime": 60
}
```

#### 7.2 Get Live User List
- **Endpoint**: `GET /client/liveUser/getliveUserList`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>&start=1&limit=20`

#### 7.3 Fetch PK Invitations
- **Endpoint**: `GET /client/liveUser/fetchPkInvitations`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>`

#### 7.4 Fetch Live Analytics
- **Endpoint**: `GET /client/liveUser/fetchLiveAnalytics`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>&liveUserId=<liveUserId>`

---

### 8. Gifts

#### 8.1 Get Gifts
- **Endpoint**: `GET /client/gift/getGiftsForUser`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>`
- **Response**:
```json
{
  "status": true,
  "message": "Gifts retrieved",
  "data": [
    {
      "_id": "...",
      "giftImage": "https://...",
      "giftName": "Rose",
      "coin": 10
    }
  ]
}
```

#### 8.2 Send Gift to Video
- **Endpoint**: `POST /client/gift/sendGiftByUser`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>&videoId=<videoId>`
- **Request Body**:
```json
{
  "giftId": "gift_id",
  "giftCount": 5
}
```

#### 8.3 Send Gift to Live
- **Endpoint**: `POST /client/gift/sendGiftTolive`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>&liveUserId=<liveUserId>`
- **Request Body**: Same as 8.2

#### 8.4 Get Received Gifts
- **Endpoint**: `GET /client/user/receviedGiftByUser`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>&start=1&limit=20`

---

### 9. Songs

#### 9.1 Favorite Song
- **Endpoint**: `POST /client/song/favoriteSongByUser`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>&songId=<songId>`

#### 9.2 Get Songs
- **Endpoint**: `GET /client/song/getSongsByUser`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>&start=1&limit=20`

#### 9.3 Get Favorite Songs
- **Endpoint**: `GET /client/song/getFavoriteSongs`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>&start=1&limit=20`

#### 9.4 Search Songs
- **Endpoint**: `GET /client/song/searchSongs`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>&search=trending&start=1&limit=20`

---

### 10. Hashtags

#### 10.1 Create Hashtag
- **Endpoint**: `POST /client/hashTag/createHashTag`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>`
- **Request Body**:
```json
{
  "hashTag": "trending"
}
```

#### 10.2 Hashtag Dropdown
- **Endpoint**: `GET /client/hashTag/hashtagDrop`
- **Headers**: `key: <secretKey>`
- **Query**: `?hashTag=trending`

#### 10.3 Get Videos of Hashtag
- **Endpoint**: `GET /client/hashTag/videosOfHashTag`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>&hashTagId=<hashTagId>&start=1&limit=20`

#### 10.4 Get Posts of Hashtag
- **Endpoint**: `GET /client/hashTag/postsOfHashTag`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>&hashTagId=<hashTagId>&start=1&limit=20`

---

### 11. Search

#### 11.1 Search Users/Posts/Videos
- **Endpoint**: `GET /client/searchHistory/search`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>&search=john&type=1&start=1&limit=20`
- **Note**: `type`: 1 = User, 2 = Post, 3 = Video

#### 11.2 Get Search History
- **Endpoint**: `GET /client/searchHistory/getSearchHistory`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>&start=1&limit=20`

#### 11.3 Delete Search History
- **Endpoint**: `DELETE /client/searchHistory/deleteSearchHistory`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>&searchHistoryId=<searchHistoryId>`

---

### 12. Notifications

#### 12.1 Get Notifications
- **Endpoint**: `GET /client/notification/notificationList`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>&start=1&limit=20`
- **Response**:
```json
{
  "status": true,
  "message": "Retrive the notification list by the user.",
  "notification": [
    {
      "_id": "...",
      "title": "Video Liked",
      "message": "Someone liked your video",
      "image": "https://...",
      "date": "2024-01-01 12:00:00",
      "userId": "...",
      "otherUserId": "..."
    }
  ]
}
```

#### 12.2 Clear Notification History
- **Endpoint**: `DELETE /client/notification/clearNotificationHistory`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>`

---

### 13. Watch History

#### 13.1 Create Watch History
- **Endpoint**: `POST /client/watchHistory/createWatchHistory`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>&videoId=<videoId>`

---

### 14. Verification Request

#### 14.1 Create Verification Request
- **Endpoint**: `POST /client/verificationRequest/verificationRequestByUser`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>`
- **Request Body**:
```json
{
  "documentType": 1,
  "documentImage": "https://storage.../document.jpg"
}
```
- **Note**: `documentType`: 1 = Passport, 2 = Aadhar Card

#### 14.2 Get Verification Request
- **Endpoint**: `GET /client/verificationRequest/verificationRequestOfUser`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>`

---

### 15. Reports

#### 15.1 Report by User
- **Endpoint**: `POST /client/report/reportByUser`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>`
- **Request Body**:
```json
{
  "type": 1,
  "typeId": "video_id",
  "reportReasonId": "reason_id",
  "message": "Inappropriate content"
}
```
- **Note**: `type`: 1 = Video, 2 = Post, 3 = User

#### 15.2 Get Report Reasons
- **Endpoint**: `GET /client/report/getReportReason`
- **Headers**: `key: <secretKey>`
- **Query**: `?type=1`

---

### 16. Complaints

#### 16.1 Create Complaint
- **Endpoint**: `POST /client/complaint/complaintByUser`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>`
- **Request Body**:
```json
{
  "message": "Issue description",
  "image": "https://storage.../image.jpg"
}
```

---

### 17. Withdrawal

#### 17.1 Coin to Amount Conversion
- **Endpoint**: `POST /client/withDrawRequest/coinToAmount`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>`
- **Request Body**:
```json
{
  "coin": 1000
}
```
- **Response**:
```json
{
  "status": true,
  "message": "Conversion successful",
  "data": {
    "amount": 1.0,
    "currency": "USD"
  }
}
```

#### 17.2 Create Withdrawal Request
- **Endpoint**: `POST /client/withDrawRequest/createWithdrawRequest`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>`
- **Request Body**:
```json
{
  "coin": 1000,
  "accountNumber": "1234567890",
  "accountHolderName": "John Doe",
  "ifscCode": "IFSC123",
  "bankName": "Bank Name",
  "upiId": "user@upi"
}
```

---

### 18. Coin Plans

#### 18.1 Get Coin Plans
- **Endpoint**: `GET /client/coinPlan/getCoinplan`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>`
- **Response**:
```json
{
  "status": true,
  "message": "Coin plans retrieved",
  "data": [
    {
      "_id": "...",
      "coin": 1000,
      "amount": 9.99,
      "currency": "USD",
      "isActive": true
    }
  ]
}
```

#### 18.2 Create Coin Plan History (Purchase)
- **Endpoint**: `POST /client/coinPlan/createHistory`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>`
- **Request Body**:
```json
{
  "coinPlanId": "plan_id",
  "paymentGateway": "stripe",
  "transactionId": "txn_123"
}
```

---

### 19. History (Transactions)

#### 19.1 Get History
- **Endpoint**: `GET /client/history/getHistory`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>&type=1&start=1&limit=20`
- **Note**: `type`: 1 = Gift, 2 = Coin Plan Purchase, 3 = Withdrawal, 4 = Random Call, 5 = Login Bonus

---

### 20. Banners

#### 20.1 Get Banners
- **Endpoint**: `GET /client/banner/getBanner`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>`
- **Response**:
```json
{
  "status": true,
  "message": "Banners retrieved",
  "data": [
    {
      "_id": "...",
      "bannerImage": "https://...",
      "bannerLink": "https://...",
      "isActive": true
    }
  ]
}
```

---

### 21. Settings

#### 21.1 Get Settings
- **Endpoint**: `GET /client/setting/getSetting`
- **Headers**: `key: <secretKey>`
- **Response**:
```json
{
  "status": true,
  "message": "Settings retrieved",
  "data": {
    "durationOfShorts": 60,
    "minCoinForCashOut": 1000,
    "loginBonus": 5000,
    "privacyPolicyLink": "https://...",
    "termsOfUsePolicyLink": "https://..."
  }
}
```

---

### 22. Chat

#### 22.1 Create Chat
- **Endpoint**: `POST /client/chat/createChat`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>`
- **Request Body**:
```json
{
  "chatTopicId": "topic_id",
  "messageType": 1,
  "message": "Hello!",
  "image": "",
  "audio": ""
}
```
- **Note**: `messageType`: 1 = Text, 2 = Image, 3 = Audio

#### 22.2 Get Old Chat
- **Endpoint**: `GET /client/chat/getOldChat`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>&chatTopicId=<chatTopicId>&start=1&limit=50`

#### 22.3 Get Chat List
- **Endpoint**: `GET /client/chatTopic/getChatList`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>&start=1&limit=20`

#### 22.4 Search Chat Users
- **Endpoint**: `POST /client/chatTopic/chatWithUserSearch`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>`
- **Request Body**:
```json
{
  "search": "john"
}
```

#### 22.5 Get Recent Chat Users
- **Endpoint**: `GET /client/chatTopic/recentChatWithUsers`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>&start=1&limit=20`

#### 22.6 Get Message Request Thumb
- **Endpoint**: `GET /client/chatRequest/getMessageRequestThumb`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>`

#### 22.7 Handle Message Request
- **Endpoint**: `POST /client/chatRequest/handleMessageRequest`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>`
- **Request Body**:
```json
{
  "chatRequestId": "request_id",
  "status": 1
}
```
- **Note**: `status`: 1 = Accept, 2 = Reject

#### 22.8 Get Old Message Requests
- **Endpoint**: `GET /client/chatRequest/getOldMessageRequest`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>&start=1&limit=20`

#### 22.9 Delete Message Request
- **Endpoint**: `DELETE /client/chatRequest/deleteMessageRequest`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>&chatRequestId=<chatRequestId>`

---

### 23. Reactions

#### 23.1 Get Reactions
- **Endpoint**: `GET /client/reaction/retrieveReaction`
- **Headers**: `key: <secretKey>`
- **Query**: `?userId=<userId>`
- **Response**:
```json
{
  "status": true,
  "message": "Reactions retrieved",
  "data": [
    {
      "_id": "...",
      "reactionImage": "https://...",
      "reactionName": "❤️",
      "isActive": true
    }
  ]
}
```

---

### 24. File Upload

#### 24.1 Upload File
- **Endpoint**: `PUT /client/file/upload-file`
- **Headers**: `key: <secretKey>`, `Content-Type: multipart/form-data`
- **Request Body** (Form Data):
  - `content`: File (image/video)
  - `folderStructure`: "profile" | "videoImageContent" | "videoUrlContent" | "postContent" | "chatContent" | "verificationContent" | "complaintContent" | "storyContent"
  - `keyName`: "filename.jpg"
- **Response**:
```json
{
  "status": true,
  "message": "File uploaded successfully",
  "url": "https://storage.../filename.jpg"
}
```

#### 24.2 Upload Multiple Files
- **Endpoint**: `PUT /client/file/upload_multiple_files`
- **Headers**: `key: <secretKey>`, `Content-Type: multipart/form-data`
- **Request Body** (Form Data):
  - `content`: Multiple files
  - `folderStructure`: Same as 24.1
- **Response**:
```json
{
  "status": true,
  "message": "Files uploaded successfully.",
  "urls": ["https://...", "https://..."]
}
```

#### 24.3 Delete Content
- **Endpoint**: `DELETE /client/file/deleteContent`
- **Headers**: `key: <secretKey>`
- **Query**: `?fileUrl=https://storage.../file.jpg`

---

## Admin APIs (`/admin/*`)

### Authentication Required
All admin routes (except `/admin/admin/login` and `/admin/admin/signUp`) require:
- **Header**: `Authorization: <JWT_TOKEN>`
- **Middleware**: `AdminMiddleware`

---

### 1. Admin Management

#### 1.1 Admin Sign Up
- **Endpoint**: `POST /admin/admin/signUp`
- **Headers**: `key: <secretKey>`
- **Request Body**:
```json
{
  "name": "Admin Name",
  "email": "admin@example.com",
  "password": "password123"
}
```

#### 1.2 Admin Login
- **Endpoint**: `POST /admin/admin/login`
- **Headers**: `key: <secretKey>`
- **Request Body**:
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```
- **Response**:
```json
{
  "status": true,
  "message": "Admin logged in successfully",
  "data": {
    "_id": "...",
    "name": "Admin Name",
    "email": "admin@example.com",
    "token": "jwt_token_here"
  }
}
```

#### 1.3 Get Admin Profile
- **Endpoint**: `GET /admin/admin/profile`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`

#### 1.4 Update Admin Profile
- **Endpoint**: `PATCH /admin/admin/updateProfile`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Request Body**:
```json
{
  "name": "Updated Name",
  "email": "updated@example.com"
}
```

#### 1.5 Update Password
- **Endpoint**: `PATCH /admin/admin/updatePassword`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Request Body**:
```json
{
  "oldPassword": "oldpass",
  "newPassword": "newpass"
}
```

#### 1.6 Set Password
- **Endpoint**: `PATCH /admin/admin/setPassword`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Request Body**:
```json
{
  "password": "newpass"
}
```

#### 1.7 Forgot Password
- **Endpoint**: `POST /admin/admin/forgotPassword`
- **Headers**: `key: <secretKey>`
- **Request Body**:
```json
{
  "email": "admin@example.com"
}
```

---

### 2. Dashboard

#### 2.1 Get Dashboard Stats
- **Endpoint**: `GET /admin/dashboard/getDashboard`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Response**:
```json
{
  "status": true,
  "message": "Dashboard data retrieved",
  "data": {
    "totalUsers": 1000,
    "totalVideos": 5000,
    "totalPosts": 2000,
    "totalCoins": 1000000,
    "totalRevenue": 50000
  }
}
```

#### 2.2 Get Chart Analytics
- **Endpoint**: `GET /admin/dashboard/getChartAnalytic`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?startDate=2024-01-01&endDate=2024-01-31&type=users`
- **Note**: `type`: "users" | "videos" | "shorts" | "posts"

---

### 3. User Management (Admin)

#### 3.1 Create Fake User
- **Endpoint**: `POST /admin/user/fakeUser`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Request Body**:
```json
{
  "name": "Fake User",
  "userName": "fakeuser",
  "image": "https://...",
  "isFake": true
}
```

#### 3.2 Update User
- **Endpoint**: `PATCH /admin/user/updateUser`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?userId=<userId>`
- **Request Body**: Same as client update profile

#### 3.3 Get Users
- **Endpoint**: `GET /admin/user/getUsers`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?start=1&limit=20&search=john`

#### 3.4 Block/Unblock User
- **Endpoint**: `PATCH /admin/user/isBlock`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?userId=<userId>`
- **Request Body**:
```json
{
  "isBlock": true
}
```

#### 3.5 Delete Users
- **Endpoint**: `DELETE /admin/user/deleteUsers`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?userId=<userId>`

#### 3.6 Get User Profile
- **Endpoint**: `GET /admin/user/getProfile`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?userId=<userId>`

---

### 4. Video Management (Admin)

#### 4.1 Upload Fake Video
- **Endpoint**: `POST /admin/video/uploadfakeVideo`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?userId=<userId>`
- **Request Body**: Same as client upload video

#### 4.2 Update Fake Video
- **Endpoint**: `PATCH /admin/video/updatefakeVideo`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?userId=<userId>&videoId=<videoId>`

#### 4.3 Get Videos
- **Endpoint**: `GET /admin/video/getVideos`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?start=1&limit=20&isFake=false`

#### 4.4 Get Videos of User
- **Endpoint**: `GET /admin/video/getVideosOfUser`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?userId=<userId>&start=1&limit=20`

#### 4.5 Get Video Details
- **Endpoint**: `GET /admin/video/getDetailOfVideo`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?videoId=<videoId>`

#### 4.6 Delete Video
- **Endpoint**: `DELETE /admin/video/deleteVideo`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?videoId=<videoId>`

---

### 5. Post Management (Admin)

#### 5.1 Upload Fake Post
- **Endpoint**: `POST /admin/post/uploadfakePost`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?userId=<userId>`
- **Request Body**: Same as client upload post

#### 5.2 Update Fake Post
- **Endpoint**: `PATCH /admin/post/updatefakePost`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?userId=<userId>&postId=<postId>`

#### 5.3 Get Posts
- **Endpoint**: `GET /admin/post/getPosts`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?start=1&limit=20&isFake=false`

#### 5.4 Get User Posts
- **Endpoint**: `GET /admin/post/getUserPost`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?userId=<userId>&start=1&limit=20`

#### 5.5 Get Post Details
- **Endpoint**: `GET /admin/post/getDetailOfPost`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?postId=<postId>`

#### 5.6 Delete Post
- **Endpoint**: `DELETE /admin/post/deletePost`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?postId=<postId>`

---

### 6. Story Management (Admin)

#### 6.1 Upload Fake Story
- **Endpoint**: `POST /admin/story/uploadFakeStory`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?userId=<userId>`
- **Request Body**: Same as client upload story

#### 6.2 Update Fake Story
- **Endpoint**: `PATCH /admin/story/updateFakeStory`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?userId=<userId>&storyId=<storyId>`

#### 6.3 Get All Stories
- **Endpoint**: `GET /admin/story/getAllStories`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?start=1&limit=20`

#### 6.4 Remove Story
- **Endpoint**: `DELETE /admin/story/removeStory`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?storyId=<storyId>`

---

### 7. Song Management

#### 7.1 Create Song
- **Endpoint**: `POST /admin/song/createSong`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Request Body**:
```json
{
  "songTitle": "Song Name",
  "singerName": "Artist Name",
  "songImage": "https://...",
  "songLink": "https://.../audio.mp3",
  "songCategoryId": "category_id"
}
```

#### 7.2 Update Song
- **Endpoint**: `PATCH /admin/song/updateSong`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?songId=<songId>`

#### 7.3 Get Songs
- **Endpoint**: `GET /admin/song/getSongs`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?start=1&limit=20`

#### 7.4 Delete Song
- **Endpoint**: `DELETE /admin/song/deletesong`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?songId=<songId>`

---

### 8. Song Category Management

#### 8.1 Create Song Category
- **Endpoint**: `POST /admin/songCategory/store`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Request Body**:
```json
{
  "songCategoryName": "Pop"
}
```

#### 8.2 Update Song Category
- **Endpoint**: `PATCH /admin/songCategory/update`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?songCategoryId=<songCategoryId>`

#### 8.3 Get Song Categories
- **Endpoint**: `GET /admin/songCategory/get`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?start=1&limit=20`

#### 8.4 Delete Song Category
- **Endpoint**: `DELETE /admin/songCategory/delete`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?songCategoryId=<songCategoryId>`

---

### 9. Hashtag Management

#### 9.1 Create Hashtag
- **Endpoint**: `POST /admin/hashTag/create`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Request Body**:
```json
{
  "hashTag": "trending"
}
```

#### 9.2 Update Hashtag
- **Endpoint**: `PATCH /admin/hashTag/update`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?hashTagId=<hashTagId>`

#### 9.3 Get Hashtags (Admin)
- **Endpoint**: `GET /admin/hashTag/getbyadmin`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?start=1&limit=20`

#### 9.4 Delete Hashtag
- **Endpoint**: `DELETE /admin/hashTag/delete`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?hashTagId=<hashTagId>`

#### 9.5 Get Hashtag
- **Endpoint**: `GET /admin/hashTag/getHashtag`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?hashTagId=<hashTagId>`

---

### 10. Gift Management

#### 10.1 Create Gift
- **Endpoint**: `POST /admin/gift/createGift`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Request Body**:
```json
{
  "giftImage": "https://...",
  "giftName": "Rose",
  "coin": 10
}
```

#### 10.2 Update Gift
- **Endpoint**: `PATCH /admin/gift/updateGift`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?giftId=<giftId>`

#### 10.3 Get Gifts
- **Endpoint**: `GET /admin/gift/getGifts`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?start=1&limit=20`

#### 10.4 Delete Gift
- **Endpoint**: `DELETE /admin/gift/deleteGift`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?giftId=<giftId>`

---

### 11. Coin Plan Management

#### 11.1 Create Coin Plan
- **Endpoint**: `POST /admin/coinplan/store`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Request Body**:
```json
{
  "coin": 1000,
  "amount": 9.99,
  "currency": "USD"
}
```

#### 11.2 Update Coin Plan
- **Endpoint**: `PATCH /admin/coinplan/update`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?coinPlanId=<coinPlanId>`

#### 11.3 Handle Switch (Active/Inactive)
- **Endpoint**: `PATCH /admin/coinplan/handleSwitch`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?coinPlanId=<coinPlanId>`
- **Request Body**:
```json
{
  "isActive": true
}
```

#### 11.4 Delete Coin Plan
- **Endpoint**: `DELETE /admin/coinplan/delete`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?coinPlanId=<coinPlanId>`

#### 11.5 Get Coin Plans
- **Endpoint**: `GET /admin/coinplan/get`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?start=1&limit=20`

#### 11.6 Fetch User Coin Plan Transactions
- **Endpoint**: `GET /admin/coinplan/fetchUserCoinplanTransactions`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?userId=<userId>&start=1&limit=20`

---

### 12. Withdrawal Management

#### 12.1 Create Withdrawal Method
- **Endpoint**: `POST /admin/withdraw/create`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Request Body**:
```json
{
  "withdrawName": "Bank Transfer",
  "isActive": true
}
```

#### 12.2 Update Withdrawal Method
- **Endpoint**: `PATCH /admin/withdraw/update`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?withdrawId=<withdrawId>`

#### 12.3 Get Withdrawal Methods
- **Endpoint**: `GET /admin/withdraw/get`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?start=1&limit=20`

#### 12.4 Delete Withdrawal Method
- **Endpoint**: `DELETE /admin/withdraw/delete`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?withdrawId=<withdrawId>`

#### 12.5 Handle Switch (Active/Inactive)
- **Endpoint**: `PATCH /admin/withdraw/handleSwitch`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?withdrawId=<withdrawId>`

---

### 13. Withdrawal Request Management

#### 13.1 Accept Withdrawal Request
- **Endpoint**: `PATCH /admin/withDrawRequest/acceptWithdrawRequest`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?withdrawRequestId=<withdrawRequestId>`

#### 13.2 Decline Withdrawal Request
- **Endpoint**: `PATCH /admin/withDrawRequest/declineWithdrawRequest`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?withdrawRequestId=<withdrawRequestId>`

#### 13.3 Get Withdrawal Requests
- **Endpoint**: `GET /admin/withDrawRequest/getWithdrawRequest`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?start=1&limit=20&status=1`
- **Note**: `status`: 1 = Pending, 2 = Accepted, 3 = Declined

---

### 14. Report Management

#### 14.1 Get Reports
- **Endpoint**: `GET /admin/report/getReports`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?startDate=2024-01-01&endDate=2024-01-31&type=1&status=1&start=1&limit=20`

#### 14.2 Solve Report
- **Endpoint**: `PATCH /admin/report/solveReport`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?reportId=<reportId>`

#### 14.3 Delete Report
- **Endpoint**: `DELETE /admin/report/deleteReport`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?reportId=<reportId>`

---

### 15. Report Reason Management

#### 15.1 Create Report Reason
- **Endpoint**: `POST /admin/reportReason/store`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Request Body**:
```json
{
  "reportReason": "Inappropriate Content"
}
```

#### 15.2 Update Report Reason
- **Endpoint**: `PATCH /admin/reportReason/update`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?reportReasonId=<reportReasonId>`

#### 15.3 Get Report Reasons
- **Endpoint**: `GET /admin/reportReason/get`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?start=1&limit=20`

#### 15.4 Delete Report Reason
- **Endpoint**: `DELETE /admin/reportReason/delete`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?reportReasonId=<reportReasonId>`

---

### 16. Complaint Management

#### 16.1 Get Complaints
- **Endpoint**: `GET /admin/complaint/getComplaints`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?start=1&limit=20`

#### 16.2 Solve Complaint
- **Endpoint**: `PATCH /admin/complaint/solveComplaint`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?complaintId=<complaintId>`
- **Request Body**:
```json
{
  "status": 2
}
```
- **Note**: `status`: 1 = Pending, 2 = Solved

#### 16.3 Delete Complaint
- **Endpoint**: `DELETE /admin/complaint/deleteComplaint`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?complaintId=<complaintId>`

---

### 17. Verification Request Management

#### 17.1 Accept Verification Request
- **Endpoint**: `PATCH /admin/verificationRequest/verificationRequestAccept`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?verificationRequestId=<verificationRequestId>`

#### 17.2 Decline Verification Request
- **Endpoint**: `PATCH /admin/verificationRequest/verificationRequestDecline`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?verificationRequestId=<verificationRequestId>`

#### 17.3 Get All Verification Requests
- **Endpoint**: `GET /admin/verificationRequest/getAll`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?start=1&limit=20`

---

### 18. Banner Management

#### 18.1 Get Banners
- **Endpoint**: `GET /admin/banner/getBanner`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?start=1&limit=20`

#### 18.2 Create Banner
- **Endpoint**: `POST /admin/banner/createBanner`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Request Body**:
```json
{
  "bannerImage": "https://...",
  "bannerLink": "https://..."
}
```

#### 18.3 Update Banner
- **Endpoint**: `PATCH /admin/banner/updateBanner`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?bannerId=<bannerId>`

#### 18.4 Delete Banner
- **Endpoint**: `DELETE /admin/banner/deleteBanner`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?bannerId=<bannerId>`

#### 18.5 Set Banner Active/Inactive
- **Endpoint**: `PATCH /admin/banner/isActive`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?bannerId=<bannerId>`
- **Request Body**:
```json
{
  "isActive": true
}
```

---

### 19. Currency Management

#### 19.1 Create Currency
- **Endpoint**: `POST /admin/currency/create`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Request Body**:
```json
{
  "name": "US Dollar",
  "symbol": "$",
  "countryCode": "US",
  "currencyCode": "USD",
  "isDefault": true
}
```

#### 19.2 Update Currency
- **Endpoint**: `PATCH /admin/currency/update`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?currencyId=<currencyId>`

#### 19.3 Get Currencies
- **Endpoint**: `GET /admin/currency/`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?start=1&limit=20`

#### 19.4 Delete Currency
- **Endpoint**: `DELETE /admin/currency/delete`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?currencyId=<currencyId>`

#### 19.5 Set Default Currency
- **Endpoint**: `PATCH /admin/currency/setdefault`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?currencyId=<currencyId>`

#### 19.6 Get Default Currency
- **Endpoint**: `GET /admin/currency/getDefault`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`

---

### 20. History Management

#### 20.1 Get History
- **Endpoint**: `GET /admin/history/getHistory`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?userId=<userId>&type=1&start=1&limit=20`

---

### 21. Live Video Management

#### 21.1 Upload Live Video
- **Endpoint**: `POST /admin/livevideo/uploadLivevideo`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?userId=<userId>`
- **Request Body**:
```json
{
  "videoTime": 60,
  "videoImage": "https://...",
  "videoUrl": "https://...",
  "liveStreamMode": 1,
  "thumbnailType": 1
}
```

#### 21.2 Update Live Video
- **Endpoint**: `PATCH /admin/livevideo/updateLivevideo`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?userId=<userId>&videoId=<videoId>`

#### 21.3 Get Live Videos
- **Endpoint**: `GET /admin/livevideo/getVideos`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?start=1&limit=20`

#### 21.4 Delete Live Video
- **Endpoint**: `DELETE /admin/livevideo/deleteVideo`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?videoId=<videoId>`

#### 21.5 Set Live Status
- **Endpoint**: `PATCH /admin/livevideo/isLive`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?videoId=<videoId>`
- **Request Body**:
```json
{
  "isLive": true
}
```

---

### 22. Reaction Management

#### 22.1 Add Reaction
- **Endpoint**: `POST /admin/reaction/addReaction`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Request Body**:
```json
{
  "reactionImage": "https://...",
  "reactionName": "❤️"
}
```

#### 22.2 Modify Reaction
- **Endpoint**: `PATCH /admin/reaction/modifyReaction`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?reactionId=<reactionId>`

#### 22.3 Set Reaction Active/Inactive
- **Endpoint**: `PATCH /admin/reaction/hasActiveReaction`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?reactionId=<reactionId>`
- **Request Body**:
```json
{
  "isActive": true
}
```

#### 22.4 Fetch Reactions
- **Endpoint**: `GET /admin/reaction/fetchReaction`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?start=1&limit=20`

#### 22.5 Remove Reaction
- **Endpoint**: `DELETE /admin/reaction/removeReaction`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Query**: `?reactionId=<reactionId>`

---

### 23. Settings Management

#### 23.1 Update Settings
- **Endpoint**: `PATCH /admin/setting/updateSetting`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`
- **Request Body**:
```json
{
  "durationOfShorts": 60,
  "minCoinForCashOut": 1000,
  "loginBonus": 5000,
  "privacyPolicyLink": "https://...",
  "termsOfUsePolicyLink": "https://...",
  "isFakeData": true,
  "videoBanned": ["1", "2", "3"],
  "postBanned": ["1", "2"],
  "storage": {
    "local": true,
    "awsS3": false,
    "digitalOcean": false
  },
  "privateKey": { ... }
}
```

---

### 24. File Upload (Admin)

#### 24.1 Upload File
- **Endpoint**: `PUT /admin/file/upload-file`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`, `Content-Type: multipart/form-data`
- **Request Body**: Same as client file upload

#### 24.2 Upload Multiple Files
- **Endpoint**: `PUT /admin/file/upload_multiple_files`
- **Headers**: `key: <secretKey>`, `Authorization: <JWT>`, `Content-Type: multipart/form-data`
- **Request Body**: Same as client multiple file upload

---

### 25. Admin Login (Public)

#### 25.1 Get Admin Login Page
- **Endpoint**: `GET /admin/login/`
- **Headers**: `key: <secretKey>`
- **Response**: Admin login page info (if applicable)

---

## Issues & Critical Bugs

### 🔴 Critical Issues

#### 1. **Admin Route File Obfuscated**
- **File**: `routes/admin/admin.route.js`
- **Issue**: Code is obfuscated/minified, making it unreadable and hard to maintain
- **Impact**: Cannot debug or modify admin authentication routes
- **Recommendation**: Replace with readable source code

#### 2. **No Input Validation Middleware**
- **Issue**: Most endpoints lack proper input validation (e.g., email format, required fields, data types)
- **Impact**: Invalid data can cause crashes or security issues
- **Recommendation**: Add `express-validator` or `joi` middleware

#### 3. **Error Handling Inconsistency**
- **Issue**: Some controllers return `status: false` with 200 status, others use proper HTTP status codes
- **Impact**: Confusing API responses, harder to handle errors in frontend
- **Recommendation**: Standardize error responses (400 for bad requests, 404 for not found, 500 for server errors)

#### 4. **No Rate Limiting**
- **Issue**: No rate limiting on API endpoints
- **Impact**: Vulnerable to DDoS attacks and abuse
- **Recommendation**: Add `express-rate-limit` middleware

#### 5. **Secret Key in Code**
- **Issue**: Secret key validation is simple string comparison
- **Impact**: If key is leaked, all APIs are accessible
- **Recommendation**: Use JWT for client APIs or OAuth2

#### 6. **Video Compression Only for Local Storage**
- **Issue**: Video compression (FFmpeg) only works for local storage, not S3/DO
- **Impact**: Large files stored on cloud storage, wasting bandwidth
- **Recommendation**: Add compression worker for cloud storage

#### 7. **No File Size Limits**
- **Issue**: No maximum file size validation in upload middleware
- **Impact**: Server can be overwhelmed by large uploads
- **Recommendation**: Add file size limits in `uploadMiddleware.js`

#### 8. **Sightengine Moderation Runs Async Without Error Handling**
- **Issue**: Video/post moderation runs after response is sent, errors are only logged
- **Impact**: Failed moderation checks don't notify users
- **Recommendation**: Add proper error handling and retry logic

#### 9. **MongoDB Injection Risk**
- **Issue**: Some queries use string concatenation instead of parameterized queries
- **Impact**: Potential NoSQL injection attacks
- **Recommendation**: Use Mongoose parameterized queries everywhere

#### 10. **No CORS Configuration**
- **Issue**: CORS is enabled for all origins (`app.use(cors())`)
- **Impact**: Security risk if API is public
- **Recommendation**: Configure allowed origins

---

### ⚠️ Medium Priority Issues

#### 11. **Global Settings Loaded Synchronously**
- **Issue**: `global.settingJSON` loaded in `index.js` but may not be ready when routes are accessed
- **Impact**: Race condition can cause undefined settings
- **Recommendation**: Ensure settings are loaded before routes are registered

#### 12. **No Pagination Validation**
- **Issue**: Pagination parameters (`start`, `limit`) not validated (could be negative or too large)
- **Impact**: Performance issues or crashes
- **Recommendation**: Validate and limit pagination values

#### 13. **Duplicate Code**
- **Issue**: Similar logic repeated across controllers (e.g., notification sending, moderation checks)
- **Impact**: Hard to maintain, bugs need to be fixed in multiple places
- **Recommendation**: Extract common logic into utility functions

#### 14. **No Request Logging**
- **Issue**: Only basic morgan logging, no detailed request/response logging
- **Impact**: Hard to debug production issues
- **Recommendation**: Add structured logging (Winston/Pino)

#### 15. **Socket.io Events Not Documented**
- **Issue**: `socket.js` has real-time events but no documentation
- **Impact**: Frontend developers don't know what events to listen for
- **Recommendation**: Document all Socket.io events

#### 16. **No API Versioning**
- **Issue**: All endpoints are at root level, no versioning
- **Impact**: Breaking changes affect all clients
- **Recommendation**: Add versioning (`/api/v1/client/...`)

#### 17. **Inconsistent Response Formats**
- **Issue**: Some endpoints return `data`, others return different field names
- **Impact**: Frontend needs different handling for each endpoint
- **Recommendation**: Standardize response format

#### 18. **No Database Indexes Documented**
- **Issue**: Models have indexes but not documented
- **Impact**: Performance issues if wrong queries are used
- **Recommendation**: Document all indexes and query patterns

---

### 💡 Low Priority / Improvements

#### 19. **No API Documentation Tool**
- **Recommendation**: Add Swagger/OpenAPI documentation

#### 20. **No Unit Tests**
- **Recommendation**: Add Jest/Mocha tests for controllers

#### 21. **No Environment Variable Validation**
- **Recommendation**: Validate required env vars on startup

#### 22. **No Health Check Endpoint**
- **Recommendation**: Add `/health` endpoint for monitoring

#### 23. **No Request ID Tracking**
- **Recommendation**: Add request IDs for tracing

#### 24. **No API Response Caching**
- **Recommendation**: Add Redis caching for frequently accessed data

#### 25. **No Webhook Support**
- **Recommendation**: Add webhooks for payment gateway callbacks

---

## Testing Checklist

### Authentication
- [ ] Test secret key validation (valid key)
- [ ] Test secret key validation (invalid key)
- [ ] Test secret key validation (missing key)
- [ ] Test admin JWT authentication (valid token)
- [ ] Test admin JWT authentication (expired token)
- [ ] Test admin JWT authentication (invalid token)

### User Management
- [ ] Create user (sign up)
- [ ] Login user
- [ ] Update profile
- [ ] Get profile
- [ ] Delete account
- [ ] Validate username (available)
- [ ] Validate username (taken)

### Video Management
- [ ] Upload video
- [ ] Update video
- [ ] Get videos of user
- [ ] Get all videos (feed)
- [ ] Like video
- [ ] Share video
- [ ] Delete video
- [ ] Get videos of song

### Post Management
- [ ] Upload post
- [ ] Update post
- [ ] Get all posts (feed)
- [ ] Get posts of user
- [ ] Like post
- [ ] Share post
- [ ] Delete post

### Comments
- [ ] Create comment
- [ ] Like comment
- [ ] Get comments

### Follow/Unfollow
- [ ] Follow user
- [ ] Unfollow user
- [ ] Get followers
- [ ] Get following

### Story
- [ ] Upload story
- [ ] React to story
- [ ] Reply to story
- [ ] View story
- [ ] Delete story
- [ ] Get followed user stories

### Live Streaming
- [ ] Go live
- [ ] Get live user list
- [ ] Send gift to live

### Gifts
- [ ] Get gifts
- [ ] Send gift to video
- [ ] Send gift to live

### Songs
- [ ] Get songs
- [ ] Favorite song
- [ ] Search songs

### Hashtags
- [ ] Create hashtag
- [ ] Get videos of hashtag
- [ ] Get posts of hashtag

### Search
- [ ] Search users
- [ ] Search posts
- [ ] Search videos
- [ ] Get search history
- [ ] Delete search history

### Notifications
- [ ] Get notifications
- [ ] Clear notification history

### Reports & Complaints
- [ ] Create report
- [ ] Create complaint
- [ ] Get report reasons

### Withdrawal
- [ ] Convert coin to amount
- [ ] Create withdrawal request

### Coin Plans
- [ ] Get coin plans
- [ ] Purchase coin plan

### File Upload
- [ ] Upload single file
- [ ] Upload multiple files
- [ ] Delete file

### Admin APIs
- [ ] Admin login
- [ ] Admin sign up
- [ ] Get dashboard stats
- [ ] Manage users (CRUD)
- [ ] Manage videos (CRUD)
- [ ] Manage posts (CRUD)
- [ ] Manage songs (CRUD)
- [ ] Manage gifts (CRUD)
- [ ] Manage coin plans (CRUD)
- [ ] Manage withdrawal requests
- [ ] Manage reports
- [ ] Manage complaints
- [ ] Manage settings

---

## Environment Variables

Required environment variables (`.env` file):

```env
PORT=3000
MongoDb_Connection_String=mongodb://localhost:27017/shortie
secretKey=your_secret_key_here
JWT_SECRET=your_jwt_secret_here
baseURL=http://localhost:3000
```

---

## Postman Collection

To test all endpoints, import the following Postman collection structure:

1. **Base URL**: `{{baseURL}}`
2. **Headers**:
   - `key: {{secretKey}}`
   - `Authorization: {{adminToken}}` (for admin routes)

3. **Variables**:
   - `baseURL`: Your backend URL
   - `secretKey`: Your secret key
   - `adminToken`: Admin JWT token (after login)
   - `userId`: Test user ID
   - `videoId`: Test video ID
   - `postId`: Test post ID

---

## Support

For issues or questions:
1. Check this documentation
2. Review error logs
3. Test with Postman/curl
4. Contact backend team

---

**Last Updated**: 2024-01-XX
**Version**: 1.0.0
