import numpy as np

# Function to compute the jitteriness score from linear movement
def compute_jitteriness_from_linear_movement(data, window_size):
    """
    Calculate the jitteriness score based on the perpendicular distance from linear movement.
    
    Parameters:
    - data: A list of (x, y) tuples representing eye coordinates.
    - window_size: The size of the window over which the linear movement and jitteriness is calculated.
    
    Returns:
    - jitter_scores: A list of jitteriness scores computed for each window.
    """
    jitter_scores = []

    for i in range(len(data) - window_size):
        segment = data[i:i+window_size]
        start, end = segment[0], segment[-1]
        
        # Defining the line by its start and end point
        A, B = np.array(start), np.array(end)
        n = B - A
        n = n.astype(np.float64)
        n /= np.linalg.norm(n)
        
        # Calculate the perpendicular distance for each point in the segment
        distances = [np.abs(np.cross(p-A, B-A)/np.linalg.norm(B-A)) for p in segment]
        jitter_scores.append(np.mean(distances))
        
    return jitter_scores

# Function to apply smoothing to data
def apply_smoothing(data, window_size):
    """
    Apply smoothing to a data series using a moving average.
    
    Parameters:
    - data: A list of values to be smoothed.
    - window_size: The size of the window for averaging.
    
    Returns:
    - smoothed_data: A list of smoothed values.
    """
    return np.convolve(data, np.ones(window_size)/window_size, mode='valid')