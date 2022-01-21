class CommenterController {
    constructor() {
        
    }
    async build(editor, tabs, commentButton, loading) {
        this.apiKey = await this.getApiKey();
        this._cm = CodeMirror(editor, {
            mode: "go",
            theme: "gruvbox-dark",
            lineNumbers: true,
            indentWithTabs: true,
            value: "// Insert a code snippet and then click auto-comment!"
        });
        this.tabController(tabs);
        this.commentController(commentButton, loading);
        this.lang = "go";
    }
    tabController(tabs) {
        tabs.forEach((tab) => {
            tab.addEventListener("click", (e) => {
                tabs.forEach((t) => {
                    t.classList.replace("bg-gray-500", "bg-gray-300");
                    t.classList.replace("text-gray-200", "text-gray-500");
                });
                e.target.classList.replace("bg-gray-300", "bg-gray-500");
                e.target.classList.replace("text-gray-500", "text-gray-200");
                this._cm.setOption("mode", e.target.dataset.lang);
                this.lang = e.target.dataset.lang;
            });
        });
    }
    convertOptions(options) {
        if (options.length == 0) {
            return "Seems like we had an error on the backend. Sorry about that."
        }
        let beginning = this.lang === "python" ? '# COMMENT OPTIONS' : '/* COMMENT OPTIONS'
        options.forEach((e, i) => {
            beginning += `\n\n${this.lang === "python" ? "#" : ""}\t${i}.) ${e}`
        })
        beginning += this.lang === "python" ? "\n" : '\n\n*/\n'
        return beginning
    }
    commentController(commentButton, loader) {
        commentButton.addEventListener("click", async (e) => {
            loader.classList.toggle('hidden')
            let options
            try {
                options = await this.submitRequest(this._cm.getValue());
            } catch {
                options = { comments: [] }
            }
            let pos = {
                line: 0,
                ch: 0
            }
            this._cm.replaceRange(this.convertOptions(options.comments)+"\n", pos)
            loader.classList.toggle('hidden')
        });
    }
    async getApiKey() {
        let res = await fetch(
            "https://us-central1-commenterai.cloudfunctions.net/generateToken",
            {
                method: "GET"
            }
        );
        let key = await res.text();
        console.log(key)
        return key
    }
    async submitRequest(data) {
        let res = await fetch(
            `https://us-central1-commenterai.cloudfunctions.net/comment?token=${this.apiKey}`,
            {
                method: "POST",
                body: JSON.stringify({
                    code: data,
                    language: this.lang,
                }),
            }
        );
        let comment = await res.json();
        return comment;
    }
}

if (document.addEventListener) {
    const parent = document.getElementById("editor");
    const tabs = document.querySelectorAll(".languages");
    const commentButton = document.getElementById("comment-button");
    const loader = document.getElementById("loading-gif");
    if (parent && tabs && commentButton) {
        const controller = new CommenterController();
        (async function(c) {
            await c.build(editor, tabs, commentButton, loader)
        })(controller)
    }
}
