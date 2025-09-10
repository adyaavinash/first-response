from PyPDF2 import PdfReader
from sentence_transformers import SentenceTransformer
from langchain.text_splitter import CharacterTextSplitter
import faiss
import numpy as np
import os

# Paths
DATA_DIR = "../data/first_aid/"
INDEX_DIR = os.path.join(DATA_DIR, "faiss_index")
os.makedirs(INDEX_DIR, exist_ok=True)

def pdf_to_text(path):
    reader = PdfReader(path)
    return "\n".join([p.extract_text() for p in reader.pages if p.extract_text()])

docs = []
for pdf in ["WHO_manual.pdf", "WHO_manual_2.pdf", "RedCross_manual.pdf", "RedCross_manual_2.pdf"]:
    docs.append(pdf_to_text(os.path.join(DATA_DIR, pdf)))

splitter = CharacterTextSplitter(chunk_size=800, chunk_overlap=100)
chunks = []
for d in docs:
    chunks.extend(splitter.split_text(d))

np.save(os.path.join(INDEX_DIR, "docs.npy"), chunks)

model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")  # multilingual model
embeddings = model.encode(chunks, convert_to_numpy=True)

index = faiss.IndexFlatL2(embeddings.shape[1])
index.add(embeddings)
faiss.write_index(index, os.path.join(INDEX_DIR, "faiss.index"))

print(f"✅ Index built with {len(chunks)} chunks. Saved to {INDEX_DIR}")
