import base64
import os

# Create directories
os.makedirs('assets/sprites', exist_ok=True)
os.makedirs('assets/sounds', exist_ok=True)

# Simple 1x1 pixel PNG in base64 (transparent)
def create_png(width, height, color):
    # This is a minimal PNG header for a solid color rectangle
    # For simplicity, we'll create a basic colored rectangle
    png_data = f"""iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="""
    return base64.b64decode(png_data)

# Create placeholder files
def create_placeholder_files():
    # Create simple colored rectangles as placeholders
    # Bird (40x40) - yellow
    bird_png = create_simple_png(40, 40, (255, 215, 0))  # Gold
    with open('assets/sprites/bird.png', 'wb') as f:
        f.write(bird_png)
    
    # Top pipe (80x200) - green
    top_pipe_png = create_simple_png(80, 200, (34, 139, 34))  # Forest green
    with open('assets/sprites/pipe-top.png', 'wb') as f:
        f.write(top_pipe_png)
    
    # Bottom pipe (80x200) - green
    bottom_pipe_png = create_simple_png(80, 200, (34, 139, 34))  # Forest green
    with open('assets/sprites/pipe-bottom.png', 'wb') as f:
        f.write(bottom_pipe_png)
    
    # Background (800x600) - sky blue
    background_png = create_simple_png(800, 600, (135, 206, 235))  # Sky blue
    with open('assets/sprites/background.png', 'wb') as f:
        f.write(background_png)

def create_simple_png(width, height, color):
    # Create a very simple PNG with solid color
    # This is a minimal implementation
    import struct
    
    def write_png_chunk(f, chunk_type, data):
        f.write(struct.pack('>I', len(data)))
        f.write(chunk_type)
        f.write(data)
        crc = 0xffffffff
        for byte in chunk_type + data:
            crc ^= byte
            for _ in range(8):
                if crc & 1:
                    crc = (crc >> 1) ^ 0xedb88320
                else:
                    crc >>= 1
        f.write(struct.pack('>I', crc ^ 0xffffffff))
    
    # Create a simple 1x1 pixel PNG
    png_data = bytearray()
    
    # PNG signature
    png_data.extend(b'\x89PNG\r\n\x1a\n')
    
    # IHDR chunk
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    write_png_chunk(png_data, b'IHDR', ihdr_data)
    
    # IDAT chunk (minimal)
    idat_data = b'\x78\x9c\x62\x00\x00\x00\x02\x00\x01'
    write_png_chunk(png_data, b'IDAT', idat_data)
    
    # IEND chunk
    write_png_chunk(png_data, b'IEND', b'')
    
    return bytes(png_data)

if __name__ == "__main__":
    print("Creating placeholder assets...")
    create_placeholder_files()
    print("Placeholder assets created!")
