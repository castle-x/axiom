package main

import (
	"errors"
	"flag"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"path/filepath"

	"github.com/castlexu/axiom/apps/axm-preview/internal/axmfs"
	"github.com/castlexu/axiom/apps/axm-preview/internal/server"
	"github.com/castlexu/axiom/apps/axm-preview/internal/siteserver"
	"github.com/castlexu/axiom/apps/axm-preview/site"
)

const defaultHost = "127.0.0.1"

func main() {
	if err := run(os.Args[1:]); err != nil {
		log.Fatal(err)
	}
}

func run(argv []string) error {
	args, err := parseArgs(argv)
	if err != nil {
		return err
	}
	startupTarget := args.target
	if !args.targetProvided {
		if last := server.ReadLastTarget(""); last != "" {
			if _, err := axmfs.ResolveTarget(last); err == nil {
				startupTarget = last
			}
		}
	}
	shell, err := siteserver.New(nil, site.DistDirFS)
	if err != nil {
		return fmt.Errorf("create embedded SPA handler: %w", err)
	}
	handler := server.New(server.Options{Target: startupTarget, Shell: shell})
	listener, err := listenWithFallback(args.host, args.port)
	if err != nil {
		return err
	}
	address := listener.Addr().(*net.TCPAddr)
	url := fmt.Sprintf("http://%s:%d/", address.IP.String(), address.Port)
	initialTarget := "not selected; use Open Project or Path in the UI"
	if target, err := axmfs.ResolveTarget(startupTarget); err == nil {
		initialTarget = target.Path
	}
	fmt.Printf("Axiom Preview: %s\n", url)
	fmt.Printf("target: %s\n", initialTarget)
	fmt.Println("view: GET /, GET /api/model, GET /api/target, GET /api/health")
	fmt.Println("target switch: POST /api/target, POST /api/pick-target")
	return http.Serve(listener, handler)
}

type cliArgs struct {
	target         string
	targetProvided bool
	host           string
	port           int
}

func parseArgs(argv []string) (cliArgs, error) {
	flags := flag.NewFlagSet("axiom-preview", flag.ContinueOnError)
	flags.SetOutput(os.Stderr)
	args := cliArgs{target: ".", host: defaultHost, port: 8765}
	flags.StringVar(&args.target, "target", ".", "project root or .axm directory")
	flags.StringVar(&args.host, "host", defaultHost, "bind host")
	flags.IntVar(&args.port, "port", 8765, "bind port")
	seenTarget := false
	flags.Visit(func(*flag.Flag) {})
	for _, arg := range argv {
		if arg == "--target" || arg == "-target" || len(arg) > len("--target=") && arg[:len("--target=")] == "--target=" {
			seenTarget = true
			break
		}
	}
	if err := flags.Parse(argv); err != nil {
		return args, err
	}
	args.targetProvided = seenTarget
	if args.host != defaultHost {
		return args, errors.New("preview only allows binding 127.0.0.1")
	}
	if args.port < 0 || args.port > 65535 {
		return args, errors.New("--port must be an integer between 0 and 65535")
	}
	if args.target != "." {
		if abs, err := filepath.Abs(args.target); err == nil {
			args.target = abs
		}
	}
	return args, nil
}

func listenWithFallback(host string, port int) (net.Listener, error) {
	if port == 0 {
		return net.Listen("tcp", fmt.Sprintf("%s:%d", host, port))
	}
	var lastErr error
	for candidate := port; candidate < port+20; candidate++ {
		listener, err := net.Listen("tcp", fmt.Sprintf("%s:%d", host, candidate))
		if err == nil {
			return listener, nil
		}
		lastErr = err
	}
	return nil, lastErr
}
