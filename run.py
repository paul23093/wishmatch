if __name__ == '__main__':
    import uvicorn
    uvicorn.run(
        'app:app',
        host='0.0.0.0',
        port=7811,
        reload=True,
        debug=True,
        workers=3
    )
