import { useChatStore } from '../../stores/useChatStore';
import styles from './Dashboard.module.css';

export function VideoInfo() {
  const details = useChatStore((s) => s.videoDetails);
  if (!details) return null;

  return (
    <div className={styles.videoInfo}>
      {details.title && <div className={styles.videoTitle}>{details.title}</div>}
      {details.channelTitle && <div className={styles.videoChannel}>{details.channelTitle}</div>}
    </div>
  );
}
