// constants/emotions.js
export const EMOTIONS = [
  {
    key: "like",
    icon: (
      <svg
        width="25"
        height="25"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
      >
        <path
          fill="#1877f2"
          stroke="#ffffff"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          d="M19.5 16.065a1.5 1.5 0 1 1 0 3h-1a1.5 1.5 0 1 1 0 3H12c-4 0-3-2-11-2v-9h3a7.95 7.95 0 0 0 7.5-8c0-1.581 3-1.781 3 1.219a31.6 31.6 0 0 1-1 5.78h8a1.5 1.5 0 1 1 0 3h-1a1.5 1.5 0 1 1 0 3z"
        />
      </svg>
    ),
    label: "Thích",
    color: "#1877f2",
  },
  {
    key: "love",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 48 48"
      >
        <path
          fill="#ff2e63"
          d="M34 9c-4.2 0-7.9 2.1-10 5.4C21.9 11.1 18.2 9 14 9C7.4 9 2 14.4 2 21c0 11.9 22 24 22 24s22-12 22-24c0-6.6-5.4-12-12-12z"
        />
      </svg>
    ),
    label: "Yêu thích",
    color: "#ff2e63",
  },
  {
    key: "haha",
    icon: (
      <svg
        width="20"
        height="20"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
      >
        <g fill="none">
          <path
            fill="#ffd32a"
            d="M12 23c6.075 0 11-4.925 11-11S18.075 1 12 1S1 5.925 1 12s4.925 11 11 11"
          />
          <path
            fill="#ffa801"
            d="M12 4.826a11.8 11.8 0 0 1 10.994 7.517c0-.114.006-.228.006-.343a11 11 0 1 0-21.994.343A11.8 11.8 0 0 1 12 4.826"
          />
          <path
            stroke="#e67e22"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M12 23c6.075 0 11-4.925 11-11S18.075 1 12 1S1 5.925 1 12s4.925 11 11 11"
          />
          <path
            stroke="#e67e22"
            strokeWidth="1.5"
            d="M6.739 10.326a.24.24 0 0 1 0-.478m.001.478a.24.24 0 0 0 0-.478m10.52.478a.24.24 0 0 1 0-.478m0 .478a.24.24 0 0 0 0-.478"
          />
          <path
            fill="#ff6b81"
            stroke="#e67e22"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M15.705 15.348a.957.957 0 0 1 .927 1.194a4.782 4.782 0 0 1-9.264 0a.956.956 0 0 1 .927-1.194z"
          />
        </g>
      </svg>
    ),
    label: "Haha",
    color: "#ffd32a",
  },
  {
    key: "wow",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="35"
        height="35"
        viewBox="0 0 24 24"
      >
        <g fill="none">
          <path
            fill="#ff9f1a"
            d="M12 18.857a6.857 6.857 0 1 0 0-13.714a6.857 6.857 0 0 0 0 13.714"
          />
          <path
            fill="#cc7a00"
            fillRule="evenodd"
            d="M12 18a6 6 0 1 0 0-12a6 6 0 0 0 0 12m0 .857a6.857 6.857 0 1 0 0-13.714a6.857 6.857 0 0 0 0 13.714"
            clipRule="evenodd"
          />
          <path
            fill="#cc7a00"
            d="M10.285 10.715c.474 0 .858-.48.858-1.072s-.384-1.071-.858-1.071c-.473 0-.857.48-.857 1.071c0 .592.384 1.071.857 1.071m3.429.001c.473 0 .857-.48.857-1.072s-.384-1.071-.857-1.071s-.857.48-.857 1.071c0 .592.384 1.071.857 1.071M12 16.715c1.183 0 2.143-1.152 2.143-2.572s-.96-2.571-2.143-2.571c-1.184 0-2.143 1.15-2.143 2.571c0 1.42.96 2.572 2.143 2.572"
          />
        </g>
      </svg>
    ),
    label: "Wow",
    color: "#ff9f1a",
  },
  {
    key: "sad",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="25"
        height="25"
        viewBox="0 0 72 72"
      >
        <path
          fill="#3498db"
          d="M12.286 36a24 24 0 1 0 24-24a24.027 24.027 0 0 0-24 24Z"
        />
        <path
          fill="#2980b9"
          d="M19.683 55.204a6.3 6.3 0 0 1-.495-.02a6.068 6.068 0 0 1-5.56-6.52c.388-4.867 5.223-9.021 5.428-9.196a1.906 1.906 0 0 1 1.42-.46a1.941 1.941 0 0 1 1.331.68c.44.52 4.28 5.194 3.902 9.935a6.02 6.02 0 0 1-2.109 4.133a6.006 6.006 0 0 1-3.917 1.448Z"
        />
        <path
          fill="#2c3e50"
          d="M48.285 35.174a3 3 0 1 1-3-3a3.001 3.001 0 0 1 3 3Zm-18 0a3 3 0 1 1-3-3a3.001 3.001 0 0 1 3 3Z"
        />
        <path
          fill="none"
          stroke="#2c3e50"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M25.451 56.293a22.963 22.963 0 1 0-11.377-14.299"
        />
        <path
          fill="none"
          stroke="#2c3e50"
          strokeMiterlimit="10"
          strokeWidth="2"
          d="M22.951 52.995a5.026 5.026 0 0 0 1.762-3.45c.353-4.436-3.503-9.014-3.667-9.207a.952.952 0 0 0-1.343-.107c-.193.165-4.724 4.076-5.078 8.513a5.06 5.06 0 0 0 8.327 4.251Z"
        />
        <path
          fill="none"
          stroke="#2c3e50"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M42.786 46a12.449 12.449 0 0 0-6.843-1.853A10.389 10.389 0 0 0 29.786 46m21.636-19.702a7.403 7.403 0 0 1-5.304-.324a7.4 7.4 0 0 1-4.11-3.412m-20.823 3.725a8.44 8.44 0 0 0 9.413-3.718"
        />
      </svg>
    ),
    label: "Buồn",
    color: "#3498db",
  },
  {
    key: "angry",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="25"
        height="25"
        viewBox="0 0 72 72"
      >
        <path
          fill="#e74c3c"
          d="M48.856 16c3-2 4-5 3-9c7 2 6 10 3 15m-31.712-6c-3-2-4-5-3-9c-7 2-6 10-3 15"
        />
        <path
          fill="#c0392b"
          d="M36 13c-12.682 0-23 10.318-23 23s10.318 23 23 23s23-10.318 23-23s-10.318-23-23-23z"
        />
        <circle
          cx="36"
          cy="36"
          r="23"
          fill="none"
          stroke="#2c3e50"
          strokeMiterlimit="10"
          strokeWidth="2"
        />
        <path
          fill="#2c3e50"
          d="M30 32.925a3.001 3.001 0 0 1-6 0c0-1.655 1.345-3 3-3s3 1.345 3 3m18 0a3.001 3.001 0 0 1-6 0c0-1.655 1.345-3 3-3s3 1.345 3 3"
        />
        <path
          fill="none"
          stroke="#2c3e50"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeMiterlimit="10"
          strokeWidth="2"
          d="m23 25l7 4m19-4l-7 4m6.856-13c3-2 4-5 3-9c7 2 6 10 3 15m-31.712-6c-3-2-4-5-3-9c-7 2-6 10-3 15M29.5 44c1.284-.638 3.985-1.03 6.842-.998c2.624.03 4.99.414 6.158.998"
        />
      </svg>
    ),
    label: "Phẫn nộ",
    color: "#e74c3c",
  },
];

export const EMOTION_ICONS = EMOTIONS.reduce((acc, emotion) => {
  acc[emotion.key] = emotion.icon;
  return acc;
}, {});

export const EMOTION_COLORS = EMOTIONS.reduce((acc, emotion) => {
  acc[emotion.key] = emotion.color;
  return acc;
}, {});
