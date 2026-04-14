import urllib.request

RAW = """
photo-1595521907629-496a9f8c8d8d
photo-1594736831143-385a701dba47
photo-1571068316344-75bd76d84f99
photo-1558618047-3c8c76ca7d13
photo-1593764594328-1bb5b1d11a63
photo-1626248801379-51a0748f7a06
photo-1595433707802-7f6a8a8f5f8b
photo-1610641818989-c2051b5e2f87
photo-1620050410040-c5c0bdb9d0c7
photo-1571333250630-f0230c320b6d
photo-1502741338009-cac2772e18bc
photo-1469474968028-56623f02e42e
photo-1476480862126-209bfaa8edc8
photo-1511994714008-b6d68a8b32a2
photo-1601925260368-ae2f83cf8b7f
photo-1502877338535-766e1452684a
photo-1532298229144-0ec0c57515c7
photo-1558618666-fcd25c85cd64
"""
for pid in RAW.split():
    pid = pid.strip()
    if not pid:
        continue
    url = f"https://images.unsplash.com/{pid}?auto=format&w=200&q=70"
    req = urllib.request.Request(url, method="HEAD")
    try:
        with urllib.request.urlopen(req, timeout=12) as r:
            print("OK", pid)
    except Exception as e:
        print("NO", pid, type(e).__name__)
