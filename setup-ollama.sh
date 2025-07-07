#!/bin/bash

# Setup script for Ollama with local model
# Downloads the model from Hugging Face if not present
echo "Setting up Ollama for DMGPT5E..."

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "Ollama is not installed. Please install it first:"
    echo "Visit: https://ollama.ai/download"
    exit 1
fi

# Check if the model file exists, download if not
if [ ! -f "data/model/model.gguf" ]; then
    echo "Model file not found. Downloading from Hugging Face..."
    
    # Create the model directory if it doesn't exist
    mkdir -p data/model
    
    # Download the model from Hugging Face
    echo "Downloading DarkIdol-Llama-3.1-8B-Instruct-1.2-Uncensored.Q4_K_M.gguf..."
    curl -L "https://huggingface.co/QuantFactory/DarkIdol-Llama-3.1-8B-Instruct-1.2-Uncensored-GGUF/resolve/main/DarkIdol-Llama-3.1-8B-Instruct-1.2-Uncensored.Q4_K_M.gguf" \
         -o "data/model/model.gguf" \
         --progress-bar
    
    if [ $? -eq 0 ]; then
        # Check if the file size is reasonable (should be around 4.9GB)
        file_size=$(stat -c%s "data/model/model.gguf" 2>/dev/null || stat -f%z "data/model/model.gguf" 2>/dev/null || echo "0")
        min_size=$((4*1024*1024*1024)) # 4GB minimum
        
        if [ "$file_size" -gt "$min_size" ]; then
            echo "✅ Model downloaded successfully! ($(($file_size / 1024 / 1024)) MB)"
        else
            echo "❌ Downloaded file seems too small ($(($file_size / 1024 / 1024)) MB). Download may have failed."
            rm -f "data/model/model.gguf"
            exit 1
        fi
    else
        echo "❌ Failed to download model. Please check your internet connection and try again."
        exit 1
    fi
else
    echo "✅ Model file already exists at data/model/model.gguf"
fi

echo "Creating Ollama model from local GGUF file..."

# Create a Modelfile for Ollama with memory optimization
cat > Modelfile << EOF
FROM ./data/model/model.gguf
TEMPLATE """{{ if .System }}<|im_start|>system
{{ .System }}<|im_end|>
{{ end }}{{ if .Prompt }}<|im_start|>user
{{ .Prompt }}<|im_end|>
{{ end }}<|im_start|>assistant
{{ .Response }}<|im_end|>"""
PARAMETER stop "<|im_start|>"
PARAMETER stop "<|im_end|>"
PARAMETER stop "<|im_start|>user"
PARAMETER stop "<|im_start|>system"
PARAMETER num_ctx 4096
PARAMETER num_thread 4
PARAMETER num_gpu 0
PARAMETER num_batch 512
EOF

# Create the model in Ollama
echo "Creating memory-optimized model 'dmgpt5e' in Ollama..."
ollama create dmgpt5e -f Modelfile

if [ $? -eq 0 ]; then
    echo "✅ Memory-optimized model created successfully!"
    echo "You can now start the application with reduced memory usage."
    echo ""
    echo "To test the model, run:"
    echo "ollama run dmgpt5e 'Hello, how are you?'"
else
    echo "❌ Failed to create model. Please check the error messages above."
    exit 1
fi

# Clean up the Modelfile
rm Modelfile

echo ""
echo "Setup complete! Make sure Ollama is running:"
echo "ollama serve" 