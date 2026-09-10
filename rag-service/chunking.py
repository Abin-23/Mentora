import io
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter

def extract_text_from_pdf(pdf_bytes: bytes) -> list[dict]:
    """
    Extracts text from a PDF file byte array.
    Returns a list of dictionaries containing page text and page number.
    """
    reader = PdfReader(io.BytesIO(pdf_bytes))
    pages_data = []
    
    for page_num, page in enumerate(reader.pages):
        text = page.extract_text()
        if text:
            pages_data.append({
                "page_number": page_num + 1,
                "text": text
            })
            
    return pages_data

def chunk_document_text(pages_data: list[dict], chunk_size=1000, chunk_overlap=200) -> list[dict]:
    """
    Splits the page text into smaller chunks for embeddings.
    Maintains the page number metadata for each chunk.
    """
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
        is_separator_regex=False,
    )
    
    chunks = []
    chunk_index = 0
    
    for page in pages_data:
        page_chunks = text_splitter.split_text(page["text"])
        for chunk_text in page_chunks:
            chunks.append({
                "text": chunk_text,
                "page_number": page["page_number"],
                "chunk_index": chunk_index
            })
            chunk_index += 1
            
    return chunks
