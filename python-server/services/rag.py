from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_community.retrievers import BM25Retriever
from langchain.retrievers import EnsembleRetriever
from langchain.retrievers import ContextualCompressionRetriever
from langchain.retrievers.document_compressors import DocumentCompressorPipeline
from langchain_community.document_transformers import EmbeddingsRedundantFilter
from langchain.prompts import PromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
#from langchain_cohere import CohereRerank
from langchain.schema import Document
from langchain_community.document_loaders import PyPDFLoader
from langchain_groq import ChatGroq
from langchain.chains import RetrievalQA
from dotenv import load_dotenv
import os
load_dotenv()
GROQ_API=os.getenv("GROQ_API_KEY")
GEMINI_API=os.getenv("GEMINI_API_KEY")
groq=ChatGroq(
    api_key=GROQ_API,
    model_name="gemma2-9b-it",
    temperature=0,
)


def Rag_Calling(final_retriver):
    _redudentfilter = EmbeddingsRedundantFilter(embeddings=GoogleGenerativeAIEmbeddings(google_api_key="AIzaSyBNAqwF1Uyse800GQ0ML3dKP5CNoBRceRg", model="models/embedding-001"))
    #rerank = CohereRerank(cohere_api_key="EA5kdJri7hsSOW2i801sXGQSZgW1iP5GwPsB3MF1",model="rerank-english-v3.0")
    pipeline = DocumentCompressorPipeline(transformers=[_redudentfilter])
    final_chain = ContextualCompressionRetriever(base_compressor=pipeline, base_retriever=final_retriver)
    return final_chain

def load_and_process_data_pdf():
    try:
        #texts=text
        current_dir = os.path.dirname(os.path.abspath(__file__))
        pdf_path = os.path.join(current_dir, "Manu_Madhu.pdf")

        # Optional: print for debug
        print("Resolved PDF path:", pdf_path)

        # Confirm the file exists
        if not os.path.isfile(pdf_path):
            raise FileNotFoundError(f"PDF file not found at: {pdf_path}")
        loader = PyPDFLoader(pdf_path)
        texts=loader.load()
        cleaned_docs=[]
        for i, doc in enumerate(texts):
            new_metadata = {
                'source': doc.metadata.get('source', 'Manu_Madhu.pdf'),
                'page': doc.metadata.get('page', 0) + 1
            }
            cleaned_doc = Document(page_content=doc.page_content, metadata=new_metadata)
            cleaned_docs.append(cleaned_doc)
        chunking = RecursiveCharacterTextSplitter(chunk_size=200, chunk_overlap=30)
        chunks = chunking.split_documents(cleaned_docs)
        db = FAISS.from_documents(chunks, GoogleGenerativeAIEmbeddings(google_api_key=GEMINI_API, model="models/embedding-001"))
        return db, chunks
    except UnicodeDecodeError as e:
        print(f"Error decoding file nothing: {e}")
        raise
    except Exception as e:
        print(f"Error loading data: {e}")
        raise

async def PDFRAG(query:str):
    db,chunks=load_and_process_data_pdf()
    retriver1 = db.as_retriever(search_kwargs={"k": 4})
    retriver2 = BM25Retriever.from_documents(chunks, k=4)
    final_retriver = EnsembleRetriever(retrievers=[retriver1, retriver2], weights=[0.5, 0.5])
    template = "You should answer the question based on the context. Context: {context} and Question: {question}"
    prompt = PromptTemplate.from_template(template)
    retriver = Rag_Calling(final_retriver)
    hybrid_chain = RetrievalQA.from_chain_type(
    llm=groq,
    chain_type='stuff',
    retriever=final_retriver,
    verbose=True,
    chain_type_kwargs={
        "prompt": prompt
    }
    )
    print("calling......")
    result=hybrid_chain.invoke(query)
    return {"result":result['result']}
