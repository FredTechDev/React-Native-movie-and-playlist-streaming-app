import { useDownloadStore } from '../store/useDownloadStore';

describe('useDownloadStore State Machine Unit Tests', () => {
  beforeEach(() => {
    useDownloadStore.setState({
      tasks: {},
      totalDownloadedBytes: 0,
      availableStorageBytes: 64 * 1024 * 1024 * 1024,
      qualityPreference: '720p',
    });
  });

  it('should initialize with empty queue', () => {
    const state = useDownloadStore.getState();
    expect(state.tasks).toEqual({});
    expect(state.totalDownloadedBytes).toBe(0);
  });

  it('should append downloads to the queue and respect quality preference', () => {
    const store = useDownloadStore.getState();
    store.addToQueue('vid1', 'Sintel Movie', 'thumb.png', 50000000);

    const updatedTasks = useDownloadStore.getState().tasks;
    expect(updatedTasks['dl-vid1']).toBeDefined();
    expect(updatedTasks['dl-vid1'].status).toBe('ENQUEUED');
    expect(updatedTasks['dl-vid1'].quality).toBe('720p');
    expect(updatedTasks['dl-vid1'].sizeBytes).toBe(50000000);
  });

  it('should transition status and accumulate disk usage on completion', () => {
    const store = useDownloadStore.getState();
    store.addToQueue('vid1', 'Sintel Movie', 'thumb.png', 50000000);
    store.updateTaskStatus('dl-vid1', 'COMPLETED');

    const state = useDownloadStore.getState();
    expect(state.tasks['dl-vid1'].status).toBe('COMPLETED');
    expect(state.totalDownloadedBytes).toBe(50000000);
  });

  it('should decrement disk usage and delete tasks on cancel', () => {
    const store = useDownloadStore.getState();
    
    // Add completed task
    store.addToQueue('vid1', 'Sintel Movie', 'thumb.png', 50000000);
    store.updateTaskStatus('dl-vid1', 'COMPLETED');
    expect(useDownloadStore.getState().totalDownloadedBytes).toBe(50000000);

    // Cancel / Delete
    store.cancelDownload('dl-vid1');
    const finalState = useDownloadStore.getState();
    expect(finalState.tasks['dl-vid1']).toBeUndefined();
    expect(finalState.totalDownloadedBytes).toBe(0);
  });
});
